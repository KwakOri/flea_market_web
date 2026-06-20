"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipant,
  createParticipantMaster,
  deleteParticipantFromMarket,
  listParticipantMasters,
  listParticipants,
  updateParticipantMaster,
  updateParticipantForMarket,
  type CreateParticipantPayload,
  type UpdateParticipantPayload,
} from "@/services/participants.service";
import {
  invalidateAllMarketParticipantLists,
  invalidateParticipantMasterDetail,
  invalidateParticipantMasters,
  invalidateParticipantsByMarket,
  invalidateSettlementPreviewByMarket,
} from "@/hooks/query-invalidations";
import { participantKeys } from "@/hooks/query-keys";

export function useParticipantMasters(enabled: boolean) {
  return useQuery({
    queryKey: participantKeys.masters,
    queryFn: listParticipantMasters,
    enabled,
  });
}

export function useParticipants(marketId: string | null) {
  return useQuery({
    queryKey: participantKeys.byMarket(marketId),
    queryFn: () => {
      if (!marketId) {
        throw new Error("Market is required");
      }

      return listParticipants(marketId);
    },
    enabled: Boolean(marketId),
  });
}

export function useCreateParticipantMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateParticipantPayload) =>
      createParticipantMaster(payload),
    onSuccess: () => {
      void invalidateParticipantMasters(queryClient);
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
      void invalidateParticipantMasters(queryClient);
      void invalidateParticipantMasterDetail(queryClient, participant.id);
      void invalidateAllMarketParticipantLists(queryClient);
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
        void invalidateParticipantsByMarket(queryClient, marketId);
        void invalidateParticipantMasters(queryClient);
        void invalidateSettlementPreviewByMarket(queryClient, marketId);
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
        void invalidateParticipantsByMarket(queryClient, marketId);
        void invalidateSettlementPreviewByMarket(queryClient, marketId);
      }

      void invalidateParticipantMasters(queryClient);
      void invalidateParticipantMasterDetail(queryClient, participant.id);
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
        void invalidateParticipantsByMarket(queryClient, marketId);
        void invalidateSettlementPreviewByMarket(queryClient, marketId);
      }

      void invalidateParticipantMasters(queryClient);
    },
  });
}
