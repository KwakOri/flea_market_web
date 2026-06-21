"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateGlobalSettlementSettings,
  updateMarketSettlementSettings,
  type UpdateSettlementFeeSettingsPayload,
} from "@/services/settlement-settings.service";
import {
  invalidateGlobalSettlementSettings,
  invalidateMarketSettlementSettingsWrite,
} from "@/hooks/query-invalidations";
import {
  globalSettlementSettingsQueryOptions,
  marketSettlementSettingsQueryOptions,
} from "@/hooks/query-options";

export function useGlobalSettlementSettings(enabled: boolean) {
  return useQuery(globalSettlementSettingsQueryOptions(enabled));
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
  return useQuery(marketSettlementSettingsQueryOptions(marketId));
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
        void invalidateMarketSettlementSettingsWrite(queryClient, marketId);
      }
    },
  });
}
