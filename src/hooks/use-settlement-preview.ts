"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSettlement,
  downloadSettlementPdfArchive,
  voidSettlement,
  type CreateSettlementPayload,
  type VoidSettlementPayload,
} from "@/services/settlements.service";
import { invalidateSettlementWrite } from "@/hooks/query-invalidations";
import {
  settlementDetailQueryOptions,
  settlementPreviewByMarketQueryOptions,
  settlementsByMarketQueryOptions,
} from "@/hooks/query-options";

export function useSettlementPreview(marketId: string | null) {
  return useQuery(settlementPreviewByMarketQueryOptions(marketId));
}

export function useSettlements(marketId: string | null) {
  return useQuery(settlementsByMarketQueryOptions(marketId));
}

export function useSettlement(settlementId: string | null) {
  return useQuery(settlementDetailQueryOptions(settlementId));
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
      void invalidateSettlementWrite(
        queryClient,
        settlement.marketId,
        settlement.id,
      );
    },
  });
}

export function useVoidSettlement(settlementId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VoidSettlementPayload) => {
      if (!settlementId) {
        throw new Error("Settlement is required");
      }

      return voidSettlement(settlementId, payload);
    },
    onSuccess: (settlement) => {
      void invalidateSettlementWrite(
        queryClient,
        settlement.marketId,
        settlement.id,
      );
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
