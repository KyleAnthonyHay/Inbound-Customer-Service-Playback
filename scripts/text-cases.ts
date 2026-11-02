/** Small phased text runner. Reviewer facts never enter the agent request. */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { sendTextTurn, textAssistant, type TextTurn } from "./lib/text-agent";
import { SYSTEM_PROMPT, SPEAKER_PROMPT } from "../src/lib/assistant";
import { buildToolDefinitions } from "../src/lib/vapiTools";

type Case = { id: string; intent: string; handling: string; openings: string[]; reviewOnly: { facts: string; expected: string } };
type Run = { kind: string; voiceCallCreated: false; presentationVoiceEvidence: false; caseId: string; variant: number; testId: string; configurationHash: string; toolRuntime?: string; releaseImplementationHash?: string; fixture: Case; failure: string | null; done: boolean; cleanupComplete: boolean; reportedTextCost: number; turns: Array<TextTurn & { input: string }> };
type Reply = { run: string; input?: string; done?: boolean };

const releaseHash = () => createHash("sha256").update(readFileSync("src/lib/tools/releases.ts")).digest("hex");
const fingerprint = () => {
  if (process.env.TEXT_POC_TOOL_SERVER_URL && process.env.TEXT_POC_RELEASE_HASH !== releaseHash()) throw Error("Local release implementation differs from the running proxy; restart the proxy before testing.");
  // Pin the adapter too: changing transport/closing behavior mid-conversation
  // invalidates the comparison even if the production prompt stayed the same.
  return createHash("sha256").update(JSON.stringify({ prompt: SYSTEM_PROMPT, speakerPrompt: SPEAKER_PROMPT, adapter: readFileSync("scripts/lib/text-agent.ts", "utf8"), tools: buildToolDefinitions({ serverUrl: "redacted" }), ...(process.env.TEXT_POC_TOOL_SERVER_URL ? { releaseImplementationHash: releaseHash() } : {}) })).digest("hex");
};
const load = <T,>(file: string) => JSON.parse(readFileSync(file, "utf8")) as T;
const save = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const safeName = (name: string) => /^[a-z0-9-]+$/.test(name);

async function runPhase(dir: string, replies: Reply[]) {
  // Two isolated conversations at a time; no cross-conversation history or automatic retries.
  for (let offset = 0; offset < replies.length; offset += 2) {
    const results = await Promise.allSettled(replies.slice(offset, offset + 2).map(async item => {
      if (!safeName(item.run)) throw Error("Invalid run name.");
      const file = join(dir, `${item.run}.json`);
      const run = load<Run>(file);
      if (run.configurationHash !== fingerprint()) throw Error("Instructions changed; create a new run rather than mix configurations.");
      if (run.done || run.failure) throw Error("Run already closed or failed.");
      if (item.input) {
        if (run.turns.length >= 12) throw Error("Twelve-turn limit reached.");
        try {
          const previousChatId = run.turns.at(-1)?.chatId;
          const turn = await sendTextTurn(item.input, { env: process.env, testId: run.testId, previousChatId });
          run.turns.push({ input: item.input, ...turn });
          run.reportedTextCost += turn.reportedCost ?? 0;
        } catch (error) {
          run.failure = error instanceof Error ? error.message : "Text request failed.";
        }
      }
      if (item.done || run.failure) {
        run.done = true;
        try {
          await new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!).mutation(api.calls.remove, { callId: run.testId });
          run.cleanupComplete = true;
        } catch { run.cleanupComplete = false; }
      }
      save(file, run);
      const last = run.turns.at(-1);
      return { run: item.run, turn: run.turns.length, reply: last?.reply, tools: last?.tools.map(t => t.name), done: run.done, failure: run.failure };
    }));
    for (const result of results) {
      if (result.status === "fulfilled") console.log(JSON.stringify(result.value));
      else { console.error(result.reason instanceof Error ? result.reason.message : "Phase failed."); process.exitCode = 1; }
    }
  }
}

async function main() {
  textAssistant(process.env, "text-poc-batch-preflight"); // Existing development/credential guard; no request.
  const [command, dirArg, repliesFile] = process.argv.slice(2);
  if (command === "start") {
    const suite = load<{ cases: Case[] }>(repliesFile ?? "scripts/text-cases/curated.json");
    const dir = dirArg ?? join("docs/text-tests/curated-variations", new Date().toISOString().replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    if (readdirSync(dir).length) throw Error("Start requires an empty output directory.");
    const replies: Reply[] = [];
    for (const fixture of suite.cases) for (const [i, input] of fixture.openings.entries()) {
      const name = `${fixture.id}-v${i + 1}`;
      if (!safeName(name)) throw Error("Invalid fixture name.");
      const run: Run = { kind: "text-reasoner-proof-of-concept", voiceCallCreated: false, presentationVoiceEvidence: false, caseId: fixture.id, variant: i + 1, testId: `text-poc-${randomUUID()}`, configurationHash: fingerprint(), toolRuntime: process.env.TEXT_POC_TOOL_SERVER_URL ? "local-release-helper-with-development-proxy" : "deployed-development", ...(process.env.TEXT_POC_TOOL_SERVER_URL ? { releaseImplementationHash: releaseHash() } : {}), fixture, failure: null, done: false, cleanupComplete: false, reportedTextCost: 0, turns: [] };
      save(join(dir, `${name}.json`), run);
      replies.push({ run: name, input });
    }
    console.log(`Text-only phrasing checks: ${replies.length} fresh conversations. Results: ${dir}`);
    await runPhase(dir, replies);
  } else if (command === "reply" && dirArg && repliesFile) {
    await runPhase(dirArg, load<Reply[]>(repliesFile));
  } else throw Error("Use start [empty-output-directory] [suite.json] or reply <run-directory> <replies.json>.");
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Text batch failed."); process.exitCode = 1; });
