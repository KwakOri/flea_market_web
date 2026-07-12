"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setCurrentUserCache } from "@/hooks/query-invalidations";
import { invitationKeys } from "@/hooks/query-keys";
import {
  acceptInvitation,
  createInvitation,
  listInvitations,
  revokeInvitation,
  validateInvitation,
  type AcceptInvitationPayload,
} from "@/services/invitations.service";

export function useInvitations(enabled: boolean) {
  return useQuery({
    queryKey: invitationKeys.all,
    queryFn: listInvitations,
    enabled,
  });
}

export function useInvitationValidation(token: string) {
  return useQuery({
    queryKey: invitationKeys.validation(token),
    queryFn: () => validateInvitation(token),
    enabled: token.length >= 32,
    gcTime: 0,
    retry: false,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.all });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.all });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) => acceptInvitation(payload),
    onSuccess: (response) => {
      void setCurrentUserCache(queryClient, response.user);
      queryClient.removeQueries({ queryKey: invitationKeys.validations });
    },
  });
}
