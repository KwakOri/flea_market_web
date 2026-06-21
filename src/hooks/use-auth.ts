"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  login,
  logout,
  register,
  type LoginPayload,
  type RegisterPayload,
} from "@/services/auth.service";
import { setCurrentUserCache } from "@/hooks/query-invalidations";
import { currentUserQueryOptions } from "@/hooks/query-options";

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions());
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (response) => {
      void setCurrentUserCache(queryClient, response.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (response) => {
      void setCurrentUserCache(queryClient, response.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
