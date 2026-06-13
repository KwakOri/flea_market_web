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
import { settlementPreviewKeys } from "./use-settlement-preview";

export const receiptKeys = {
  byMarket: (marketId: string) => ["receipts", marketId] as const,
  detail: (receiptId: string) => ["receipt", receiptId] as const,
};

export function useReceipts(marketId: string | null) {
  return useQuery({
    queryKey: receiptKeys.byMarket(marketId ?? "none"),
    queryFn: () => listReceipts(marketId ?? ""),
    enabled: Boolean(marketId),
  });
}

export function useReceipt(receiptId: string | null) {
  return useQuery({
    queryKey: receiptKeys.detail(receiptId ?? "none"),
    queryFn: () => getReceipt(receiptId ?? ""),
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
        void queryClient.invalidateQueries({
          queryKey: receiptKeys.byMarket(marketId),
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(marketId),
        });
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

      void queryClient.invalidateQueries({
        queryKey: receiptKeys.detail(receipt.id),
      });

      if (resolvedMarketId) {
        void queryClient.invalidateQueries({
          queryKey: receiptKeys.byMarket(resolvedMarketId),
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(resolvedMarketId),
        });
      }
    },
  });
}
