"use client";

import { createContext, useCallback, useEffect, useRef, type ReactNode } from "react";
import { createBrowserPipelineClient, type PipelineClient } from "../worker/client";

export const PipelineClientContext = createContext<(() => PipelineClient) | null>(null);

export function PipelineProvider({ children }: Readonly<{ children: ReactNode }>) {
  const client = useRef<PipelineClient | null>(null);
  const getClient = useCallback(() => {
    client.current ??= createBrowserPipelineClient();
    return client.current;
  }, []);

  useEffect(() => {
    getClient();
    return () => {
      client.current?.dispose();
      client.current = null;
    };
  }, [getClient]);

  return <PipelineClientContext value={getClient}>{children}</PipelineClientContext>;
}
