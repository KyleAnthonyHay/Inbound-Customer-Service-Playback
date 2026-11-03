import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internal } from "../_generated/api";

export async function isDeletedCall(ctx: Pick<QueryCtx, "db">, callId: string) {
  return !!await ctx.db.query("deletedCalls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
}

/** Bounded cleanup also handles calls longer than one mutation's write budget. */
export async function deleteCallLogBatch(ctx: Pick<MutationCtx, "db" | "scheduler">, callId: string) {
  if (!await isDeletedCall(ctx, callId)) return;
  const transcripts = await ctx.db.query("transcripts").withIndex("by_call", q => q.eq("callId", callId)).take(500);
  const events = await ctx.db.query("callEvents").withIndex("by_call", q => q.eq("callId", callId)).take(500);
  for (const row of [...transcripts, ...events]) await ctx.db.delete(row._id);
  if (transcripts.length === 500 || events.length === 500)
    await ctx.scheduler.runAfter(0, internal.calls.deleteArchivedNextBatch, { callId });
}

export async function deleteArchivedCall(ctx: Pick<MutationCtx, "db" | "scheduler">, callId: string) {
  const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
  if (!call) return { ok: true, removed: false };
  if (call.status !== "ended") return { ok: false, removed: false, reason: "call-in-progress" };
  if (call.archivedAt === undefined) return { ok: false, removed: false, reason: "not-archived" };
  if (!await isDeletedCall(ctx, callId)) await ctx.db.insert("deletedCalls", { callId, deletedAt: Date.now() });
  await ctx.db.delete(call._id);
  await deleteCallLogBatch(ctx, callId);
  return { ok: true, removed: true };
}

/** Clearing the panel only changes visibility, never the call, transcript or activity records. */
export async function archiveCall(ctx: Pick<MutationCtx, "db">, callId: string) {
  const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
  if (!call) return { ok: false, archived: false, reason: "not-found" };
  if (call.status !== "ended") return { ok: false, archived: false, reason: "call-in-progress" };
  if (call.archivedAt !== undefined) return { ok: true, archived: false };
  await ctx.db.patch(call._id, { archivedAt: Date.now() });
  return { ok: true, archived: true };
}

/** Restoring only removes the visibility marker; the original history stays intact. */
export async function restoreCall(ctx: Pick<MutationCtx, "db">, callId: string) {
  const call = await ctx.db.query("calls").withIndex("by_callId", q => q.eq("callId", callId)).unique();
  if (!call) return { ok: false, restored: false, reason: "not-found" };
  if (call.status !== "ended") return { ok: false, restored: false, reason: "call-in-progress" };
  if (call.archivedAt === undefined) return { ok: true, restored: false };
  await ctx.db.patch(call._id, { archivedAt: undefined });
  return { ok: true, restored: true };
}

export async function archivePanelBatch(ctx: Pick<MutationCtx, "db" | "scheduler">, before: number) {
  const calls = await ctx.db.query("calls").withIndex("by_archivedAt_status_startedAt", q =>
    q.eq("archivedAt", undefined).eq("status", "ended").lte("startedAt", before)).take(101);
  const batch = calls.slice(0, 100);
  for (const call of batch) await ctx.db.patch(call._id, { archivedAt: Date.now() });
  const continuing = calls.length > batch.length;
  if (continuing) await ctx.scheduler.runAfter(0, internal.calls.archiveNextBatch, { before });
  return { ok: true, archived: batch.length, continuing };
}
