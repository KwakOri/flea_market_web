"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGlobalSettlementSettings,
  getMarketSettlementSettings,
  updateGlobalSettlementSettings,
  updateMarketSettlementSettings,
  type UpdateSettlementFeeSettingsPayload,
} from "@/services/settlement-settings.service";
import { participantKeys } from "./use-participants";
import { settlementPreviewKeys } from "./use-settlement-preview";

export const settlementSettingsKeys = {
  global: ["settlement-settings", "global"] as const,
  market: (marketId: string) =>
    ["settlement-settings", "market", marketId] as const,
};

export function useGlobalSettlementSettings(enabled: boolean) {
  return useQuery({
    queryKey: settlementSettingsKeys.global,
    queryFn: getGlobalSettlementSettings,
    enabled,
  });
}

export function useUpdateGlobalSettlementSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettlementFeeSettingsPayload) =>
      updateGlobalSettlementSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settlementSettingsKeys.global,
      });
    },
  });
}

export function useMarketSettlementSettings(marketId: string | null) {
  return useQuery({
    queryKey: settlementSettingsKeys.market(marketId ?? "none"),
    queryFn: () => getMarketSettlementSettings(marketId ?? ""),
    enabled: Boolean(marketId),
  });
}

export function useUpdateMarketSettlementSettings(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettlementFeeSettingsPayload) => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return updateMarketSettlementSettings(marketId, payload);
    },
    onSuccess: () => {
      if (marketId) {
        void queryClient.invalidateQueries({
          queryKey: settlementSettingsKeys.market(marketId),
        });
        void queryClient.invalidateQueries({
          queryKey: participantKeys.byMarket(marketId),
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(marketId),
        });
      }
    },
  });
}
