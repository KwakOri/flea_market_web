"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipant,
  createParticipantMaster,
  listParticipantMasters,
  listParticipants,
  type CreateParticipantPayload,
} from "@/services/participants.service";
import { settlementPreviewKeys } from "./use-settlement-preview";

export const participantKeys = {
  all: ["participant-masters"] as const,
  byMarket: (marketId: string) => ["participants", marketId] as const,
};

export function useParticipantMasters(enabled: boolean) {
  return useQuery({
    queryKey: participantKeys.all,
    queryFn: listParticipantMasters,
    enabled,
  });
}

export function useParticipants(marketId: string | null) {
  return useQuery({
    queryKey: participantKeys.byMarket(marketId ?? "none"),
    queryFn: () => listParticipants(marketId ?? ""),
    enabled: Boolean(marketId),
  });
}

export function useCreateParticipantMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateParticipantPayload) =>
      createParticipantMaster(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: participantKeys.all,
      });
    },
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
          queryKey: participantKeys.all,
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(marketId),
        });
      }
    },
  });
}
