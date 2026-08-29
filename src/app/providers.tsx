"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ApiReadinessOverlay } from "@/components/api-readiness-overlay";
import { authKeys } from "@/hooks/query-keys";
import {
  ApiError,
  subscribeToAuthExpiration,
} from "@/services/api-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) =>
              !(error instanceof ApiError && error.status === 401) &&
              failureCount < 3,
          },
        },
      }),
  );

  useEffect(
    () =>
      subscribeToAuthExpiration(() => {
        queryClient.clear();
        queryClient.setQueryData(authKeys.me, null);
      }),
    [queryClient],
  );

  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <ApiReadinessOverlay />
    </>
  );
}
