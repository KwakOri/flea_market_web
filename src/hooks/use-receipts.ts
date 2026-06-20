"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReceipt,
  getReceipt,
  listReceipts,
  updateReceipt,
  type CreateReceiptPayload,
  type UpdateReceiptPayload,
} from "@/services/receipts.service";
import {
  invalidateReceiptDetail,
  invalidateReceiptsByMarket,
  invalidateSettlementPreviewByMarket,
} from "@/hooks/query-invalidations";
import { receiptKeys } from "@/hooks/query-keys";

export function useReceipts(marketId: string | null) {
  return useQuery({
    queryKey: receiptKeys.byMarket(marketId),
    queryFn: () => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return listReceipts(marketId);
    },
    enabled: Boolean(marketId),
  });
}

export function useReceipt(receiptId: string | null) {
  return useQuery({
    queryKey: receiptKeys.detail(receiptId),
    queryFn: () => {
      if (!receiptId) {
        throw new Error("Receipt is required");
      }

      return getReceipt(receiptId);
    },
    enabled: Boolean(receiptId),
  });
}

export function useCreateReceipt(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReceiptPayload) => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return createReceipt(marketId, payload);
    },
    onSuccess: () => {
      if (marketId) {
        void invalidateReceiptsByMarket(queryClient, marketId);
        void invalidateSettlementPreviewByMarket(queryClient, marketId);
      }
    },
  });
}

export function useUpdateReceipt(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      receiptId,
      payload,
    }: {
      receiptId: string;
      payload: UpdateReceiptPayload;
    }) => updateReceipt(receiptId, payload),
    onSuccess: (receipt) => {
      const resolvedMarketId = marketId ?? receipt.marketId;

      void invalidateReceiptDetail(queryClient, receipt.id);

      if (resolvedMarketId) {
        void invalidateReceiptsByMarket(queryClient, resolvedMarketId);
        void invalidateSettlementPreviewByMarket(queryClient, resolvedMarketId);
      }
    },
  });
}
