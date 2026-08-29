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

export type CreateUserPayload = {
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
};

export function createUser(
  payload: CreateUserPayload,
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

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
