/** Parses the initiate_handoff tool result that Vapi relays to the client. */
export type HandoffResult = { ok: true; team: string } | { ok: false; reason: string; team?: string };

export function parseHandoffResult(raw: unknown): HandoffResult | null {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (o.ok === true) return { ok: true, team: typeof o.team === "string" ? o.team : "support team" };
  if (o.ok === false) return { ok: false, reason: String(o.reason ?? "unavailable"), team: typeof o.team === "string" ? o.team : undefined };
  return null;
}
