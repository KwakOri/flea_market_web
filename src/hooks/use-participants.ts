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
      void queryClient.invalidateQueries({
        queryKey: participantKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: ["participant", participant.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["participants"],
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
        void queryClient.invalidateQueries({
          queryKey: participantKeys.byMarket(marketId),
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(marketId),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: participantKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: ["participant", participant.id],
      });
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
        void queryClient.invalidateQueries({
          queryKey: participantKeys.byMarket(marketId),
        });
        void queryClient.invalidateQueries({
          queryKey: settlementPreviewKeys.byMarket(marketId),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: participantKeys.all,
      });
    },
  });
}
