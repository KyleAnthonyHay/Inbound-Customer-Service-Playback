/**
 * Scripted caller for end-to-end voice tests without a microphone.
 *
 * Creates a real Vapi call over the websocket transport, speaks each caller
 * line (macOS `say` -> ffmpeg -> PCM s16le mono), waits for the assistant to
 * finish talking, then speaks the next line. Afterwards it fetches the call
 * record from Vapi and the tool events from Convex and prints a report.
 *
 * Usage: npx tsx --env-file=.env.local scripts/voice-test.ts scripts/scenarios/<name>.json
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { FIRST_MESSAGE } from "../src/lib/assistant";

type Scenario = { name: string; expectedIntent: string; lines: string[]; maxTurnWaitMs?: number };

const KEY = process.env.VAPI_PRIVATE_KEY!;
const ASSISTANT = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const RATE = Number(process.env.VOICE_TEST_RATE ?? 24000);
const VOICE = process.env.VOICE_TEST_VOICE ?? "Samantha";

const scenarioPath = process.argv[2];
if (!KEY || !ASSISTANT || !scenarioPath) {
  console.error("Need VAPI_PRIVATE_KEY, NEXT_PUBLIC_VAPI_ASSISTANT_ID and a scenario file");
  process.exit(1);
}
const scenario = JSON.parse(readFileSync(scenarioPath, "utf8")) as Scenario;
const tmp = mkdtempSync(join(tmpdir(), "voice-test-"));

function tts(text: string, i: number): Buffer {
  const aiff = join(tmp, `${i}.aiff`);
  const raw = join(tmp, `${i}.raw`);
  execFileSync("say", ["-v", VOICE, "-o", aiff, text]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", aiff, "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", String(RATE), raw]);
  return readFileSync(raw);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Scenario: ${scenario.name} (expected intent: ${scenario.expectedIntent})`);
  const clips = scenario.lines.map((l, i) => tts(l, i));

  const res = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      assistantId: ASSISTANT,
      transport: { provider: "vapi.websocket", audioFormat: { format: "pcm_s16le", container: "raw", sampleRate: RATE } },
    }),
  });
  const call = (await res.json()) as { id: string; transport?: { websocketCallUrl?: string }; message?: unknown };
  if (!res.ok || !call.transport?.websocketCallUrl) {
    console.error("Call create failed", res.status, JSON.stringify(call).slice(0, 500));
    process.exit(1);
  }
  console.log(`Call ${call.id}`);

  const ws = new WebSocket(call.transport.websocketCallUrl);
  ws.binaryType = "arraybuffer";
  let lastAssistantAudioAt = 0;
  let assistantEverSpoke = false;
  let lastAssistantTranscriptAt = 0;
  let lastToolCallAt = 0;
  let assistantTextSinceSend = "";
  let assistantFinalsSinceSend = 0;
  // Set when the last caller clip finished streaming. Transcript finals that belong to the
  // previous agent turn can arrive after that (the greeting's "?" once ended a wait early
  // and the next caller lines talked over the agent), so only agent speech heard after the
  // clip counts towards the current turn.
  let clipEndAt = 0;
  // Vapi only emits the greeting's final transcript once the caller starts speaking, so it
  // always lands inside the first caller turn. Recognise it by its text and ignore it.
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 8).join(" ");
  const greetingKey = norm(FIRST_MESSAGE);
  let greetingFinalSeen = false;
  const events: string[] = [];
  const transcript: string[] = [];
  let ended = false;
  const t0 = Date.now();
  const stamp = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  // Vapi streams audio continuously, silence included, so "speaking" is judged by energy.
  const isLoud = (buf: Buffer) => {
    let peak = 0;
    for (let i = 0; i + 1 < buf.length; i += 2) {
      const v = Math.abs(buf.readInt16LE(i));
      if (v > peak) peak = v;
    }
    return peak > 600; // ~2% of full scale
  };
  ws.on("message", (data, isBinary) => {
    if (isBinary || data instanceof ArrayBuffer) {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (isLoud(buf)) {
        lastAssistantAudioAt = Date.now();
        if (lastAssistantAudioAt > clipEndAt) assistantEverSpoke = true;
      }
      return;
    }
    try {
      const m = JSON.parse(data.toString()) as Record<string, unknown>;
      const type = String(m.type);
      if (type === "transcript") {
        const countsForThisTurn = m.role === "assistant" && lastAssistantAudioAt > clipEndAt;
        if (m.role === "assistant") {
          lastAssistantTranscriptAt = Date.now();
          if (countsForThisTurn) assistantEverSpoke = true;
        }
        if (m.transcriptType === "final") {
          const isGreeting = m.role === "assistant" && !greetingFinalSeen && norm(String(m.transcript)) === greetingKey;
          if (isGreeting) greetingFinalSeen = true;
          if (countsForThisTurn && !isGreeting) {
            assistantTextSinceSend += " " + String(m.transcript);
            assistantFinalsSinceSend++;
          }
          transcript.push(`${stamp()} ${String(m.role).toUpperCase()}: ${m.transcript}`);
          console.log(`  ${String(m.role).toUpperCase()}: ${m.transcript}`);
        }
      } else if (type === "tool-calls") {
        lastToolCallAt = Date.now();
        const list = (m.toolCallList as Array<{ function?: { name?: string; arguments?: unknown } }>) ?? [];
        const names = list.map((t) => `${t.function?.name}(${JSON.stringify(t.function?.arguments ?? {})})`);
        events.push(`${stamp()} TOOL-CALLS ${names.join(", ")}`);
        console.log(`  >> tool-calls: ${names.join(", ")}`);
      } else if (type === "tool-calls-result") {
        const r = m.toolCallResult as { name?: string; result?: string } | undefined;
        events.push(`${stamp()} RESULT ${r?.name}: ${String(r?.result ?? "").slice(0, 120)}`);
      } else if (type === "status-update") {
        events.push(`${stamp()} STATUS ${m.status} ${m.endedReason ?? ""}`);
        if (m.status === "ended") ended = true;
      } else if (type !== "conversation-update" && type !== "speech-update") {
        events.push(`${stamp()} ${type}`);
      }
    } catch {
      /* ignore */
    }
  });
  ws.on("close", () => {
    ended = true;
  });
  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", reject);
  });

  const waitForAssistantToFinish = async (maxMs: number) => {
    const start = Date.now();
    // The transport only sends transcript partials, tool-calls, status and hangup.
    // Done when the assistant has spoken since our last line and both its audio and
    // transcript partials have been quiet for 2.5 s, unless a tool call happened after
    // its last words (GPT-Live pauses mid-turn while a tool runs): then wait up to 15 s
    // for it to resume.
    while (Date.now() - start < maxMs && !ended) {
      const now = Date.now();
      const quietFor = now - Math.max(lastAssistantAudioAt, lastAssistantTranscriptAt);
      // A tool call (incl. GPT-Live's delegate) means the real answer is still coming: hold up to 15 s
      // unless the assistant has since asked us something.
      const askedSinceTool = lastToolCallAt < lastAssistantTranscriptAt && /\?/.test(assistantTextSinceSend);
      const toolPending = now - lastToolCallAt < 15000 && !askedSinceTool;
      const turnLooksComplete = /\?/.test(assistantTextSinceSend) || quietFor > 7000;
      // Final transcripts can trail the audio by several seconds. Returning before the turn's
      // final arrived let it land during the next turn (the greeting's "?" then ended that wait
      // early and the caller talked over the agent), so wait for at least one final unless the
      // agent has been quiet for a long time.
      const finalArrived = assistantFinalsSinceSend > 0 || quietFor > 15000;
      if (assistantEverSpoke && quietFor > 2500 && turnLooksComplete && finalArrived && !toolPending) return;
      await sleep(100);
    }
  };

  const sendClip = async (pcm: Buffer) => {
    // stream in 20 ms frames in near real time
    const frame = (RATE * 2 * 20) / 1000;
    for (let o = 0; o < pcm.length && !ended; o += frame) {
      ws.send(pcm.subarray(o, o + frame));
      await sleep(20);
    }
    // trailing silence so the endpointer closes the turn
    ws.send(Buffer.alloc(frame * 25));
    clipEndAt = Date.now();
  };

  await waitForAssistantToFinish(20000); // greeting
  for (let i = 0; i < clips.length && !ended; i++) {
    console.log(`  CALLER (sent): ${scenario.lines[i]}`);
    assistantEverSpoke = false;
    assistantTextSinceSend = "";
    assistantFinalsSinceSend = 0;
    await sendClip(clips[i]);
    await waitForAssistantToFinish(scenario.maxTurnWaitMs ?? 45000);
  }
  if (!ended) {
    ws.send(JSON.stringify({ type: "end-call" }));
    await sleep(1500);
    ws.close();
  }

  // Report from the server side
  await sleep(4000);
  const rec = (await (await fetch(`https://api.vapi.ai/call/${call.id}`, { headers: { Authorization: `Bearer ${KEY}` } })).json()) as {
    endedReason?: string;
    messages?: Array<{ role: string; message?: string; toolCalls?: Array<{ function: { name: string; arguments: string } }>; name?: string; result?: string; secondsFromStart?: number }>;
  };
  const toolCalls = (rec.messages ?? []).filter((m) => m.role === "tool_calls").flatMap((m) => (m.toolCalls ?? []).map((t) => t.function.name));
  const timing = analyzeTiming(rec.messages ?? []);
  let convexEvents: unknown[] = [];
  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../convex/_generated/api");
    convexEvents = await new ConvexHttpClient(CONVEX_URL).query(api.callEvents.byCall, { callId: call.id });
  } catch (e) {
    console.error("convex read failed", e);
  }

  const report = {
    scenario: scenario.name,
    expectedIntent: scenario.expectedIntent,
    callId: call.id,
    endedReason: rec.endedReason,
    vapiToolCalls: toolCalls,
    timing,
    convexToolEvents: (convexEvents as Array<{ kind: string; tool?: string; status?: string; durationMs?: number; detail?: string }>)
      .filter((e) => e.kind === "tool-end")
      .map((e) => `${e.tool} ${e.status} ${e.durationMs ?? "?"}ms ${e.detail ?? ""}`),
    liveEvents: events,
    transcript: (rec.messages ?? []).filter((m) => m.role === "bot" || m.role === "user").map((m) => `${m.role === "bot" ? "AGENT" : "CALLER"}: ${m.message}`),
  };
  const out = join("docs", "voice-tests", `${new Date().toISOString().replace(/[:.]/g, "-")}-${scenario.name}.json`);
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log("\n=== REPORT ===");
  console.log("endedReason:", report.endedReason);
  console.log("Vapi tool calls:", report.vapiToolCalls);
  console.log("Timing (per caller turn):");
  for (const t of timing.turns) console.log(`  ${t.summary}`);
  console.log(`Longest silence after a caller turn: ${timing.longestSilenceS}s; longest gap after a transition line: ${timing.longestGapAfterTransitionS}s`);
  console.log("Convex tool events:", report.convexToolEvents);
  console.log("saved:", out);
}

type VapiMsg = { role: string; message?: string; toolCalls?: Array<{ function: { name: string; arguments: string } }>; secondsFromStart?: number; duration?: number; endTime?: number; time?: number };

/**
 * "No unexplained silence" check. For each caller turn, measures how long the caller waited
 * before hearing anything (silenceS), whether the first thing they heard was a short transition
 * line ("one moment", "let me check") rather than the real answer, and how long the gap was
 * between that transition line and the next thing the agent said (gapAfterTransitionS). Tool
 * calls inside the turn are listed with their offset from the caller's last word.
 */
function analyzeTiming(messages: VapiMsg[]) {
  const endOf = (m: VapiMsg) => {
    if (typeof m.endTime === "number" && typeof m.time === "number" && typeof m.secondsFromStart === "number") return m.secondsFromStart + (m.endTime - m.time) / 1000;
    if (typeof m.duration === "number" && typeof m.secondsFromStart === "number") return m.secondsFromStart + m.duration / 1000;
    return m.secondsFromStart ?? 0;
  };
  const isTransition = (text: string) => /\b(one moment|one second|just a (second|sec|moment)|hold on|let me (check|pull|see|look|take)|bear with me|give me a (second|moment))\b/i.test(text) && text.split(/\s+/).length <= 16;
  const timeline = messages.filter((m) => m.role === "user" || m.role === "bot" || m.role === "tool_calls").sort((a, b) => (a.secondsFromStart ?? 0) - (b.secondsFromStart ?? 0));
  const turns: Array<{ caller: string; silenceS: number | null; firstHeard: string; transition: boolean; gapAfterTransitionS: number | null; tools: string[]; summary: string }> = [];
  for (let i = 0; i < timeline.length; i++) {
    const m = timeline[i];
    if (m.role !== "user") continue;
    const callerEnd = endOf(m);
    const rest: VapiMsg[] = [];
    for (let j = i + 1; j < timeline.length && timeline[j].role !== "user"; j++) rest.push(timeline[j]);
    const bots = rest.filter((r) => r.role === "bot");
    const tools = rest.filter((r) => r.role === "tool_calls").flatMap((r) => (r.toolCalls ?? []).map((t) => `${t.function.name}@+${((r.secondsFromStart ?? 0) - callerEnd).toFixed(1)}s`));
    const first = bots[0];
    const silenceS = first ? Math.max(0, +((first.secondsFromStart ?? 0) - callerEnd).toFixed(1)) : null;
    const transition = !!first && isTransition(first.message ?? "");
    const second = bots[1];
    const gapAfterTransitionS = transition && second ? +((second.secondsFromStart ?? 0) - endOf(first)).toFixed(1) : null;
    const summary = `"${(m.message ?? "").slice(0, 40)}" -> ${silenceS === null ? "no reply" : `${silenceS}s silence`}, then ${transition ? "transition" : "answer"}: "${(first?.message ?? "").slice(0, 50)}"${gapAfterTransitionS !== null ? ` -> ${gapAfterTransitionS}s gap -> "${(second?.message ?? "").slice(0, 40)}"` : ""}${tools.length ? ` [${tools.join(", ")}]` : ""}`;
    turns.push({ caller: m.message ?? "", silenceS, firstHeard: first?.message ?? "", transition, gapAfterTransitionS, tools, summary });
  }
  const longestSilenceS = Math.max(0, ...turns.map((t) => t.silenceS ?? 0));
  const longestGapAfterTransitionS = Math.max(0, ...turns.map((t) => t.gapAfterTransitionS ?? 0));
  return { turns, longestSilenceS, longestGapAfterTransitionS };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
