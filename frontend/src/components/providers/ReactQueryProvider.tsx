"use client";

import React from "react";
import { isServer, QueryClient, QueryClientProvider } from "@tanstack/react-query";

let browserQueryClient: QueryClient | null = null;

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function getClient() {
  if (isServer) return createClient();
  browserQueryClient ??= createClient();
  return browserQueryClient;
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const client = React.useMemo(getClient, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
