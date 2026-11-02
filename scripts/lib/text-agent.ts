import { buildAssistant } from "../../src/lib/assistant";

type Env = Record<string, string | undefined>;
type Row = { role?: string; content?: string; tool_call_id?: string; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> };
export type TextTurn = {
  chatId: string;
  reply: string;
  tools: Array<{ name: string; arguments: unknown; result: unknown }>;
  reportedCost: number | null;
};

export function textAssistant(env: Env, testId: string) {
  if (env.CONVEX_DEPLOYMENT !== "dev:ceaseless-rhinoceros-106" || !env.VAPI_PRIVATE_KEY || !env.VAPI_TOOL_SECRET || env.NEXT_PUBLIC_CONVEX_SITE_URL !== "https://ceaseless-rhinoceros-106.convex.site")
    throw new Error("Text checks require the configured development environment.");
  if (!/^text-poc-[a-z0-9-]{1,80}$/.test(testId)) throw new Error("Invalid text test identifier.");
  let toolServer = `${env.NEXT_PUBLIC_CONVEX_SITE_URL}/vapi/tools`;
  let toolSecret = env.VAPI_TOOL_SECRET;
  if (env.TEXT_POC_TOOL_SERVER_URL) {
    const url = new URL(env.TEXT_POC_TOOL_SERVER_URL);
    if (url.protocol !== "https:" || url.pathname !== "/vapi/tools" || url.search || url.hash || url.username || url.password || !env.TEXT_POC_TOOL_SECRET || env.TEXT_POC_TOOL_SECRET === env.VAPI_TOOL_SECRET)
      throw new Error("Local text tools require an HTTPS tool endpoint and a separate temporary secret.");
    toolServer = url.href;
    toolSecret = env.TEXT_POC_TOOL_SECRET;
  }
  const voice = buildAssistant({ toolServerUrl: `${toolServer}?textTestId=${testId}`, toolSecret });
  const reasoner = voice.model.reasoner;
  return {
    name: "Playback Support text POC",
    model: {
      provider: reasoner.provider,
      model: reasoner.model,
      reasoningEffort: reasoner.reasoningEffort,
      maxTokens: 600,
      messages: [{ role: "system", content: reasoner.instructions.replaceAll("{{call.type}}", "text-proof-of-concept").replaceAll("{{customer.number}}", "") + "\nTEXT TEST ADAPTER: This is a text-only reasoning proof of concept. No voice call exists. If the support policy calls for endCall, finish with its prescribed goodbye wording as the final text reply instead. All other support and tool rules still apply." }],
      tools: voice.model.tools.filter(t => t.type === "function"),
    },
  };
}

function parsed(value: string | undefined): unknown {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

export async function sendTextTurn(input: string, options: { env: Env; testId: string; previousChatId?: string; fetcher?: typeof fetch }): Promise<TextTurn> {
  if (!input.trim() || input.length > 4000) throw new Error("A text turn must contain 1–4000 characters.");
  const assistant = textAssistant(options.env, options.testId);
  const res = await (options.fetcher ?? fetch)("https://api.vapi.ai/chat", {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(60000),
    headers: { Authorization: `Bearer ${options.env.VAPI_PRIVATE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ assistant, input, ...(options.previousChatId ? { previousChatId: options.previousChatId } : {}), stream: false }),
  });
  if (!res.ok) throw new Error(`Vapi text request returned HTTP ${res.status}; no voice call was requested.`);
  const body = await res.json() as { id?: string; output?: Row[]; cost?: number };
  if (!body.id || !Array.isArray(body.output)) throw new Error("Vapi returned an incomplete text response.");
  const tools = body.output.flatMap(row => (row.tool_calls ?? []).map(tc => ({
    name: tc.function.name,
    arguments: parsed(tc.function.arguments),
    result: parsed(body.output?.find(output => output.role === "tool" && output.tool_call_id === tc.id)?.content),
  })));
  const result: TextTurn = {
    chatId: body.id,
    reply: body.output.filter(row => row.role === "assistant" && row.content).map(row => row.content).join("\n\n"),
    tools,
    reportedCost: typeof body.cost === "number" ? body.cost : null,
  };
  // Vapi echoes the transient assistant (including webhook credentials); never export that object.
  let projection = JSON.stringify(result);
  for (const key of ["VAPI_PRIVATE_KEY", "VAPI_TOOL_SECRET", "PCO_APPLICATION_ID", "PCO_SECRET", "TEXT_POC_TOOL_SECRET"]) {
    const secret = options.env[key];
    if (secret) projection = projection.split(secret).join("[redacted]");
  }
  return JSON.parse(projection) as TextTurn;
}
