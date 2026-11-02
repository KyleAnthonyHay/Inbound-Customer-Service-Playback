import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { reserveDevCall, updateDevReservation } from "./lib/callAdmission";

export const reserve = internalMutation({
  args: { token: v.string() }, returns: v.boolean(),
  handler: (ctx, args) => reserveDevCall(ctx, args.token),
});

export const update = internalMutation({
  args: { token: v.optional(v.string()), callId: v.optional(v.string()), release: v.boolean() },
  returns: v.null(), handler: updateDevReservation,
});
