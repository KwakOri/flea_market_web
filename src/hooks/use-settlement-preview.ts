"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSettlement,
  downloadSettlementPdfArchive,
  getSettlement,
  getSettlementPreview,
  listSettlements,
  voidSettlement,
  type CreateSettlementPayload,
  type VoidSettlementPayload,
} from "@/services/settlements.service";
import {
  invalidateSettlementDetail,
  invalidateSettlementPreviewByMarket,
  invalidateSettlementsByMarket,
} from "@/hooks/query-invalidations";
import {
  settlementKeys,
  settlementPreviewKeys,
} from "@/hooks/query-keys";

export function useSettlementPreview(marketId: string | null) {
  return useQuery({
    queryKey: settlementPreviewKeys.byMarket(marketId),
    queryFn: () => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return getSettlementPreview(marketId);
    },
    enabled: Boolean(marketId),
  });
}

export function useSettlements(marketId: string | null) {
  return useQuery({
    queryKey: settlementKeys.byMarket(marketId),
    queryFn: () => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return listSettlements(marketId);
    },
    enabled: Boolean(marketId),
  });
}

export function useSettlement(settlementId: string | null) {
  return useQuery({
    queryKey: settlementKeys.detail(settlementId),
    queryFn: () => {
      if (!settlementId) {
        throw new Error("Settlement is required");
      }

      return getSettlement(settlementId);
    },
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
        void invalidateSettlementsByMarket(queryClient, marketId);
        void invalidateSettlementPreviewByMarket(queryClient, marketId);
      }

      void invalidateSettlementDetail(queryClient, settlement.id);
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
      void invalidateSettlementDetail(queryClient, settlement.id);
      void invalidateSettlementsByMarket(queryClient, settlement.marketId);
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
