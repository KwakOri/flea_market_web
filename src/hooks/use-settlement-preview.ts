"use client";

import { useQuery } from "@tanstack/react-query";
import { getSettlementPreview } from "@/services/settlements.service";

export const settlementPreviewKeys = {
  byMarket: (marketId: string) => ["settlement-preview", marketId] as const,
};

export function useSettlementPreview(marketId: string | null) {
  return useQuery({
    queryKey: settlementPreviewKeys.byMarket(marketId ?? "none"),
    queryFn: () => getSettlementPreview(marketId ?? ""),
    enabled: Boolean(marketId),
  });
}
