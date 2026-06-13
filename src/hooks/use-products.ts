"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  listProducts,
  updateProduct,
  type CreateProductPayload,
  type UpdateProductPayload,
} from "@/services/products.service";

export const productKeys = {
  byMarketParticipant: (marketId: string, participantId: string) =>
    ["products", marketId, participantId] as const,
};

export function useProducts(
  marketId: string | null,
  participantId: string | null,
) {
  return useQuery({
    queryKey: productKeys.byMarketParticipant(
      marketId ?? "none",
      participantId ?? "none",
    ),
    queryFn: () => listProducts(marketId ?? "", participantId ?? ""),
    enabled: Boolean(marketId && participantId),
  });
}

export function useCreateProduct(
  marketId: string | null,
  participantId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      if (!participantId) {
        throw new Error("Participant is required");
      }

      return createProduct(marketId, participantId, payload);
    },
    onSuccess: () => {
      if (marketId && participantId) {
        void queryClient.invalidateQueries({
          queryKey: productKeys.byMarketParticipant(marketId, participantId),
        });
      }
    },
  });
}

export function useUpdateProduct(
  marketId: string | null,
  participantId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateProductPayload;
    }) => updateProduct(productId, payload),
    onSuccess: () => {
      if (marketId && participantId) {
        void queryClient.invalidateQueries({
          queryKey: productKeys.byMarketParticipant(marketId, participantId),
        });
      }
    },
  });
}
