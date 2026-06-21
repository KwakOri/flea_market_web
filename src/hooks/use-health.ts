"use client";

import { useQuery } from "@tanstack/react-query";
import { healthQueryOptions } from "@/hooks/query-options";

export function useHealth() {
  return useQuery(healthQueryOptions());
}
