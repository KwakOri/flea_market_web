import { apiRequest } from "./api-client";
import type { EditableUserRole, UserRole } from "./auth.service";

export type UserStatus = "pending_email_verification" | "active" | "disabled";

export type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

export function listUsers(): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>("/users");
}

export function updateUserRole(
  userId: string,
  role: EditableUserRole,
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}
