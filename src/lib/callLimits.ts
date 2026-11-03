/**
 * Vapi maxDurationSeconds for the saved assistant and for development call overrides.
 * A hard safety cap only: a real audio-routing walkthrough can pass ten minutes, and the
 * previous 600 s cap cut Jordan's 2026-11-03 phone call off mid-sentence while the agent
 * was offering a specialist. Normal calls end through endCall long before this.
 */
export const MAX_CALL_DURATION_SECONDS = 30 * 60;
