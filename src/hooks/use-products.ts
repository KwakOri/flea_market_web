"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  listProducts,
  updateProduct,
  type CreateProductPayload,
  type UpdateProductPayload,
} from "@/services/products.service";
import { invalidateProductsByMarketParticipant } from "@/hooks/query-invalidations";
import { productKeys } from "@/hooks/query-keys";

export function useProducts(
  marketId: string | null,
  participantId: string | null,
) {
  return useQuery({
    queryKey: productKeys.byMarketParticipant(marketId, participantId),
    queryFn: () => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      if (!participantId) {
        throw new Error("Participant is required");
      }

      return listProducts(marketId, participantId);
    },
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
        void invalidateProductsByMarketParticipant(
          queryClient,
          marketId,
          participantId,
        );
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
        void invalidateProductsByMarketParticipant(
          queryClient,
          marketId,
          participantId,
        );
      }
    },
  });
}
