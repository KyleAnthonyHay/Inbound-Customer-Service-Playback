/**
 * Caller ID helpers shared by the Convex tool webhook and the tests.
 *
 * On inbound phone calls Vapi includes the caller's number as
 * `message.call.customer.number` (E.164, e.g. "+19294044992") on every
 * webhook, and exposes it to the prompt as {{customer.number}}. Browser
 * calls have no customer number.
 */

/** Values the model may pass as callbackNumber to mean "the number I'm calling from". */
const CALLER_ID_WORDS = /^(caller[- ]?id|same( number)?|this( number)?|current number|the number (i'?m|i am) calling from)$/i;

/** True when the model asked to reuse the caller ID instead of giving a number. */
export function wantsCallerId(given: string | undefined): boolean {
  const g = (given ?? "").trim();
  return g === "" || CALLER_ID_WORDS.test(g);
}

/** Last four digits, for reading a number back without saying the whole thing. */
export function lastFour(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits.slice(-4);
}

/** "+19294044992" -> "+1 (929) 404-4992"; other lengths are returned as given. */
export function formatCallerNumber(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return number;
}

/** What the tools tell the model about the live call. callerNumber is set on phone calls only. */
export type CallInfo = { callId: string; callerNumber?: string; callType?: string };

/** Reads the call fields Vapi attaches to every server message and tool webhook. */
export function callInfoOf(call: { id?: string; type?: string; customer?: { number?: string } } | undefined): CallInfo {
  const number = call?.customer?.number?.trim();
  return { callId: call?.id ?? "unknown", callType: call?.type, callerNumber: number || undefined };
}
