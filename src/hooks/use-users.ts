"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hooks/query-keys";
import type { EditableUserRole } from "@/services/auth.service";
import { listUsers, updateUserRole } from "@/services/users.service";

export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: listUsers,
    enabled,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      role,
      userId,
    }: {
      role: EditableUserRole;
      userId: string;
    }) => updateUserRole(userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
