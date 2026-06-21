"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipant,
  createParticipantMaster,
  deleteParticipantFromMarket,
  updateParticipantMaster,
  updateParticipantForMarket,
  type CreateParticipantPayload,
  type UpdateParticipantPayload,
} from "@/services/participants.service";
import {
  invalidateMarketParticipantWrite,
  invalidateParticipantMasterWrite,
} from "@/hooks/query-invalidations";
import {
  participantMastersQueryOptions,
  participantsByMarketQueryOptions,
} from "@/hooks/query-options";

export function useParticipantMasters(enabled: boolean) {
  return useQuery(participantMastersQueryOptions(enabled));
}

export function useParticipants(marketId: string | null) {
  return useQuery(participantsByMarketQueryOptions(marketId));
}

export function useCreateParticipantMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateParticipantPayload) =>
      createParticipantMaster(payload),
    onSuccess: () => {
      void invalidateParticipantMasterWrite(queryClient);
    },
  });
}

export function useUpdateParticipantMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      participantId,
      payload,
    }: {
      participantId: string;
      payload: UpdateParticipantPayload;
    }) => updateParticipantMaster(participantId, payload),
    onSuccess: (participant) => {
      void invalidateParticipantMasterWrite(queryClient, participant.id);
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
        void invalidateMarketParticipantWrite(queryClient, marketId);
      }
    },
  });
}

export function useUpdateParticipantForMarket(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      participantId,
      payload,
    }: {
      participantId: string;
      payload: UpdateParticipantPayload;
    }) => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return updateParticipantForMarket(marketId, participantId, payload);
    },
    onSuccess: (participant) => {
      if (marketId) {
        void invalidateMarketParticipantWrite(
          queryClient,
          marketId,
          participant.id,
        );
      }
    },
  });
}

export function useDeleteParticipantFromMarket(marketId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return deleteParticipantFromMarket(marketId, participantId);
    },
    onSuccess: () => {
      if (marketId) {
        void invalidateMarketParticipantWrite(queryClient, marketId);
      }
    },
  });
}
