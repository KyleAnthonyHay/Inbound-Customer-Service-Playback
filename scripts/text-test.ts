/** Developer-only text POC. Vapi Chat token usage; never creates a voice call or saved assistant. */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { sendTextTurn, textAssistant, type TextTurn } from "./lib/text-agent";

async function main() {
  const testId = `text-poc-${randomUUID()}`;
  textAssistant(process.env, testId); // Guard the dev target before any request.
  const scenarioPath = process.argv[2];
  const scenario = scenarioPath && scenarioPath !== "--interactive"
    ? JSON.parse(readFileSync(scenarioPath, "utf8")) as { name: string; expectedIntent: string; lines: string[] }
    : null;
  if (scenario && (!/^[a-z0-9-]+$/.test(scenario.name) || !Array.isArray(scenario.lines) || scenario.lines.length > 12)) throw new Error("Invalid scenario.");
  const terminal = scenario ? null : createInterface({ input: stdin, output: stdout });
  const turns: Array<TextTurn & { input: string }> = [];
  let previousChatId: string | undefined;
  let failure: string | null = null;
  console.log("Text reasoning POC — shared dev instructions/tools. No audio session; text model usage still applies.");
  try {
    for (let i = 0; i < (scenario?.lines.length ?? 12); i++) {
      const input = scenario ? scenario.lines[i] : await terminal!.question("You (/exit to finish): ");
      if (input.trim() === "/exit") break;
      if (!input.trim()) { i--; continue; }
      if (scenario) console.log(`CALLER: ${input}`);
      const turn = await sendTextTurn(input, { env: process.env, testId, previousChatId });
      previousChatId = turn.chatId;
      turns.push({ input, ...turn });
      console.log(`AGENT: ${turn.reply}`);
      if (turn.tools.length) console.log(`TOOLS: ${turn.tools.map(t => t.name).join(", ")}`);
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : "Text test failed.";
    process.exitCode = 1;
  } finally {
    terminal?.close();
    mkdirSync("docs/text-tests", { recursive: true });
    const file = `docs/text-tests/${new Date().toISOString().replace(/[:.]/g, "-")}-${scenario?.name ?? "interactive"}.json`;
    writeFileSync(file, JSON.stringify({ kind: "text-reasoner-proof-of-concept", voiceCallCreated: false, presentationVoiceEvidence: false, scenario: scenario?.name ?? "interactive", expectedIntent: scenario?.expectedIntent ?? null, failure, reportedTextCost: turns.reduce((sum, t) => sum + (t.reportedCost ?? 0), 0), turns }, null, 2) + "\n");
    console.log(`Saved text POC transcript: ${file}`);
    // Only remove the isolated tool log/history for this generated text test ID.
    try { await new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!).mutation(api.calls.remove, { callId: testId }); }
    catch { console.error("The isolated text tool log could not be cleaned up."); }
    if (failure) console.error(failure);
  }
}

main().catch(() => { console.error("Text POC could not start. Check the dev configuration and scenario file."); process.exitCode = 1; });
