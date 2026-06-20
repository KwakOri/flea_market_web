"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGlobalSettlementSettings,
  getMarketSettlementSettings,
  updateGlobalSettlementSettings,
  updateMarketSettlementSettings,
  type UpdateSettlementFeeSettingsPayload,
} from "@/services/settlement-settings.service";
import {
  invalidateGlobalSettlementSettings,
  invalidateMarketSettlementSettings,
  invalidateParticipantsByMarket,
  invalidateSettlementPreviewByMarket,
} from "@/hooks/query-invalidations";
import { settlementSettingsKeys } from "@/hooks/query-keys";

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
      void invalidateGlobalSettlementSettings(queryClient);
    },
  });
}

export function useMarketSettlementSettings(marketId: string | null) {
  return useQuery({
    queryKey: settlementSettingsKeys.market(marketId),
    queryFn: () => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return getMarketSettlementSettings(marketId);
    },
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
        void invalidateMarketSettlementSettings(queryClient, marketId);
        void invalidateParticipantsByMarket(queryClient, marketId);
        void invalidateSettlementPreviewByMarket(queryClient, marketId);
      }
    },
  });
}
