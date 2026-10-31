/**
 * Public, client-safe configuration. Only NEXT_PUBLIC_* values belong here.
 * The Vapi *public* key is designed to be shipped to browsers; never put the
 * private key in this file or in any NEXT_PUBLIC_ variable.
 */
export const config = {
  vapiPublicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "",
  vapiAssistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "",
  /** Convex HTTP actions base (…convex.site); hosts the Vapi tool webhook. */
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "",
  /** Inbound test number shown on the landing page; display only. */
  inboundNumber: process.env.NEXT_PUBLIC_INBOUND_NUMBER ?? "",
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
  /** Caller-ID style label shown on the call screen. */
  callerLabel: "Playback Support",
} as const;

export const isVapiConfigured = () => config.vapiPublicKey.length > 0;
export const toolServerUrl = () => (config.convexSiteUrl ? `${config.convexSiteUrl.replace(/\/$/, "")}/vapi/tools` : "");
