"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSettlement,
  downloadSettlementPdfArchive,
  getSettlement,
  getSettlementPreview,
  listSettlements,
  type CreateSettlementPayload,
} from "@/services/settlements.service";

export const settlementPreviewKeys = {
  byMarket: (marketId: string) => ["settlement-preview", marketId] as const,
};

export const settlementKeys = {
  byMarket: (marketId: string) => ["settlements", marketId] as const,
  detail: (settlementId: string) => ["settlement", settlementId] as const,
};

export function useSettlementPreview(marketId: string | null) {
  return useQuery({
    queryKey: settlementPreviewKeys.byMarket(marketId ?? "none"),
    queryFn: () => getSettlementPreview(marketId ?? ""),
    enabled: Boolean(marketId),
  });
}

export function useSettlements(marketId: string | null) {
  return useQuery({
    queryKey: settlementKeys.byMarket(marketId ?? "none"),
    queryFn: () => listSettlements(marketId ?? ""),
    enabled: Boolean(marketId),
  });
}

export function useSettlement(settlementId: string | null) {
  return useQuery({
    queryKey: settlementKeys.detail(settlementId ?? "none"),
    queryFn: () => getSettlement(settlementId ?? ""),
    enabled: Boolean(settlementId),
  });
}

export function useCreateSettlement(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSettlementPayload) => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return createSettlement(marketId, payload);
    },
    onSuccess: (settlement) => {
      if (marketId) {
        void queryClient.invalidateQueries({
          queryKey: settlementKeys.byMarket(marketId),
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(marketId),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: settlementKeys.detail(settlement.id),
      });
    },
  });
}

export function useDownloadSettlementPdfArchive(marketId: string | null) {
  return useMutation({
    mutationFn: () => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return downloadSettlementPdfArchive(marketId);
    },
  });
}
