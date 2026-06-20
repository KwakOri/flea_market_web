"use client";

import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/services/health.service";
import { healthKeys } from "@/hooks/query-keys";

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.status,
    queryFn: getHealth,
  });
}
