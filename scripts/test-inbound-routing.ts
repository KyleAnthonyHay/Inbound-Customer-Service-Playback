import { test } from "node:test";
import assert from "node:assert/strict";
import { conversationLines, inboundAssistantId, PROD_ASSISTANT_ID, PROD_SITE } from "../src/lib/tools/inboundRouting";

test("assistant-request answers with the configured assistant, the prod assistant on prod, and nothing elsewhere", () => {
  assert.equal(inboundAssistantId({ VAPI_INBOUND_ASSISTANT_ID: " custom ", CONVEX_SITE_URL: PROD_SITE }), "custom");
  assert.equal(inboundAssistantId({ CONVEX_SITE_URL: `${PROD_SITE}/` }), PROD_ASSISTANT_ID);
  assert.equal(inboundAssistantId({ CONVEX_SITE_URL: "https://ceaseless-rhinoceros-106.convex.site" }), null);
  assert.equal(inboundAssistantId({}), null);
});

test("tool webhook conversation keeps spoken lines in order and drops tool and system messages", () => {
  const lines = conversationLines([
    { role: "system", message: "prompt" },
    { role: "bot", message: "Hi there!", time: 1000 },
    { role: "user", message: "My songs won't load.", time: 2000 },
    { role: "tool_calls", toolCalls: [{ id: "t1" }] },
    { role: "tool_call_result", result: "{}" },
    { role: "user", message: "   " },
    { role: "assistant", message: "Let me check." },
  ]);
  assert.deepEqual(lines, [
    { role: "assistant", text: "Hi there!", at: 1000 },
    { role: "user", text: "My songs won't load.", at: 2000 },
    { role: "assistant", text: "Let me check.", at: 0 },
  ]);
});
