"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReceipt,
  deleteReceipt,
  updateReceipt,
  type CreateReceiptPayload,
  type UpdateReceiptPayload,
} from "@/services/receipts.service";
import {
  invalidateReceiptWrite,
} from "@/hooks/query-invalidations";
import {
  receiptDetailQueryOptions,
  receiptsByMarketQueryOptions,
} from "@/hooks/query-options";

export function useReceipts(marketId: string | null) {
  return useQuery(receiptsByMarketQueryOptions(marketId));
}

export function useReceipt(receiptId: string | null) {
  return useQuery(receiptDetailQueryOptions(receiptId));
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
        void invalidateReceiptWrite(queryClient, marketId);
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

      if (resolvedMarketId) {
        void invalidateReceiptWrite(queryClient, resolvedMarketId, receipt.id);
      }
    },
  });
}

export function useDeleteReceipt(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiptId: string) => deleteReceipt(receiptId),
    onSuccess: (_result, receiptId) => {
      if (marketId) {
        void invalidateReceiptWrite(queryClient, marketId, receiptId);
      }
    },
  });
}
