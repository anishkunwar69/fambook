"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactFlowProvider } from "reactflow";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ReactFlowProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ReactFlowProvider>
    </ClerkProvider>
  );
}

export default Providers;
