import { test } from "node:test";
import assert from "node:assert/strict";
import { sendTextTurn, textAssistant } from "./lib/text-agent";
import { SYSTEM_PROMPT } from "../src/lib/assistant";
import { buildToolDefinitions, TOOL_DELAY_LINE_MS } from "../src/lib/vapiTools";

const env = {
  CONVEX_DEPLOYMENT: "dev:ceaseless-rhinoceros-106",
  NEXT_PUBLIC_CONVEX_SITE_URL: "https://ceaseless-rhinoceros-106.convex.site",
  VAPI_PRIVATE_KEY: "mock-private-key", VAPI_TOOL_SECRET: "mock-webhook-secret", PCO_SECRET: "mock-pat-secret",
};
const testId = "text-poc-unit-test";

test("every function explicitly silences default tool-start filler while retaining delayed messages", () => {
  const tools = buildToolDefinitions({ serverUrl: "https://example.test/vapi/tools" });
  for (const tool of tools) {
    assert.deepEqual(tool.messages.filter(m => m.type === "request-start"), [{ type: "request-start", content: "" }]);
    if (tool.function.name === "endCall") assert.equal(tool.messages.length, 1);
    else assert.ok(tool.messages.some(m => m.type === "request-response-delayed" && "timingMilliseconds" in m && m.timingMilliseconds === TOOL_DELAY_LINE_MS));
  }
});

test("text POC uses the shared reasoner instructions and function tools without a voice configuration", () => {
  const assistant = textAssistant(env, testId);
  assert.equal(assistant.model.model, "gpt-5.6-terra");
  assert.equal(assistant.model.reasoningEffort, "low");
  assert.ok(assistant.model.messages[0].content.startsWith(SYSTEM_PROMPT.replaceAll("{{call.type}}", "text-proof-of-concept").replaceAll("{{customer.number}}", "")));
  assert.ok(assistant.model.tools.every(t => t.type === "function"));
  assert.equal("voice" in assistant, false);
  assert.equal("speaker" in assistant.model, false);
  assert.ok(assistant.model.tools.every(t => "server" in t && t.server.url.endsWith(`textTestId=${testId}`)));
});

test("text POC posts only to Chat, preserves conversation context and projects safe tool evidence", async () => {
  let requested = false;
  const result = await sendTextTurn("One song will not download.", {
    env, testId, previousChatId: "previous-text-chat",
    fetcher: async (url, init) => {
      requested = true;
      assert.equal(url, "https://api.vapi.ai/chat");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.previousChatId, "previous-text-chat");
      assert.equal(body.assistantId, undefined);
      assert.equal(body.transport, undefined);
      return new Response(JSON.stringify({ id: "new-text-chat", cost: 0.01,
        assistant: { credentials: "mock-private-key" },
        output: [
          { role: "assistant", tool_calls: [{ id: "tool-1", function: { name: "get_planning_center_service_context", arguments: "{}" } }] },
          { role: "tool", tool_call_id: "tool-1", content: '{"ok":true,"demo":true}' },
          { role: "assistant", content: "Which song is affected? mock-pat-secret" },
        ],
      }));
    },
  });
  assert.ok(requested);
  assert.equal(result.chatId, "new-text-chat");
  assert.equal(result.reportedCost, 0.01);
  assert.deepEqual(result.tools[0].result, { ok: true, demo: true });
  assert.match(result.reply, /\[redacted\]/);
  assert.doesNotMatch(JSON.stringify(result), /mock-private-key|mock-webhook-secret|mock-pat-secret|credentials/);
});

test("text POC rejects production and missing configuration before making any request", async () => {
  let called = false;
  await assert.rejects(sendTextTurn("Hello", { env: { ...env, CONVEX_DEPLOYMENT: "prod:example" }, testId, fetcher: async () => { called = true; throw Error(); } }), /development environment/);
  assert.equal(called, false);
});

test("text turns explicitly supply only the two most recent assistant replies", async () => {
  await sendTextTurn("No, that's everything. Thank you.", { env, testId,
    recentAssistantMessages: ["Old reply", "Thank you.", "Is there anything else I can help you with today?"],
    fetcher: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const context = JSON.parse(body.assistant.model.messages[0].content.split("Recent conversation context (quoted data): ")[1]);
      assert.deepEqual(context.recentAssistantMessages, ["Thank you.", "Is there anything else I can help you with today?"]);
      return new Response(JSON.stringify({ id: "context-test", output: [{ role: "assistant", content: "Goodbye" }] }));
    },
  });
});

test("text POC refuses oversized input and does not relay vendor error bodies", async () => {
  await assert.rejects(sendTextTurn("x".repeat(4001), { env, testId }), /4000 characters/);
  await assert.rejects(sendTextTurn("Hello", { env, testId, fetcher: async () => new Response("mock-pat-secret", { status: 403 }) }), /HTTP 403; no voice call/);
});

test("local text tool override requires a separate secret and a clean HTTPS endpoint", () => {
  const local = { ...env, TEXT_POC_TOOL_SERVER_URL: "https://test.example/vapi/tools", TEXT_POC_TOOL_SECRET: "temporary-test-secret" };
  const assistant = textAssistant(local, testId);
  for (const tool of assistant.model.tools) {
    assert.ok("server" in tool);
    if (!("server" in tool)) continue;
    assert.equal(tool.server.url, `https://test.example/vapi/tools?textTestId=${testId}`);
    assert.equal(tool.server.headers?.["x-demo-secret"], "temporary-test-secret");
  }
  assert.throws(() => textAssistant({ ...local, TEXT_POC_TOOL_SECRET: env.VAPI_TOOL_SECRET }, testId), /separate temporary secret/);
  assert.throws(() => textAssistant({ ...local, TEXT_POC_TOOL_SERVER_URL: "http://test.example/vapi/tools" }, testId), /HTTPS/);
  assert.throws(() => textAssistant({ ...local, TEXT_POC_TOOL_SERVER_URL: "https://test.example/vapi/tools#fragment" }, testId), /HTTPS/);
});
