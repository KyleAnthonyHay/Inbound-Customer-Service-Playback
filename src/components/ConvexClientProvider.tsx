"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createContext, useContext, useState } from "react";
import { config } from "@/lib/config";

const ConvexReadyContext = createContext(false);
/** True once a ConvexProvider is mounted above this component. */
export const useConvexReady = () => useContext(ConvexReadyContext);

/**
 * The client is created only in the browser (lazy initializer, window guard)
 * so nothing non-deterministic runs during Next's server prerender. On the
 * server, children render without a provider; components that call useQuery
 * must branch on `useConvexReady()`.
 */
export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState<ConvexReactClient | null>(() =>
    typeof window !== "undefined" && config.convexUrl ? new ConvexReactClient(config.convexUrl) : null
  );
  if (!client) return <>{children}</>;
  return (
    <ConvexProvider client={client}>
      <ConvexReadyContext.Provider value={true}>{children}</ConvexReadyContext.Provider>
    </ConvexProvider>
  );
}
