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
  byParticipant: (participantId: string) =>
    ["products", participantId] as const,
};

export function useProducts(participantId: string | null) {
  return useQuery({
    queryKey: productKeys.byParticipant(participantId ?? "none"),
    queryFn: () => listProducts(participantId ?? ""),
    enabled: Boolean(participantId),
  });
}

export function useCreateProduct(participantId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => {
      if (!participantId) {
        throw new Error("Participant is required");
      }

      return createProduct(participantId, payload);
    },
    onSuccess: () => {
      if (participantId) {
        void queryClient.invalidateQueries({
          queryKey: productKeys.byParticipant(participantId),
        });
      }
    },
  });
}

export function useUpdateProduct(participantId: string | null) {
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
      if (participantId) {
        void queryClient.invalidateQueries({
          queryKey: productKeys.byParticipant(participantId),
        });
      }
    },
  });
}
