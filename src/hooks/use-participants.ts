"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipant,
  listParticipants,
  type CreateParticipantPayload,
} from "@/services/participants.service";
import { settlementPreviewKeys } from "./use-settlement-preview";

export const participantKeys = {
  byMarket: (marketId: string) => ["participants", marketId] as const,
};

export function useParticipants(marketId: string | null) {
  return useQuery({
    queryKey: participantKeys.byMarket(marketId ?? "none"),
    queryFn: () => listParticipants(marketId ?? ""),
    enabled: Boolean(marketId),
  });
}

export function useCreateParticipant(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateParticipantPayload) => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return createParticipant(marketId, payload);
    },
    onSuccess: () => {
      if (marketId) {
        void queryClient.invalidateQueries({
          queryKey: participantKeys.byMarket(marketId),
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(marketId),
        });
      }
    },
  });
}
