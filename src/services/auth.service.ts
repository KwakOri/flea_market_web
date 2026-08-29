import { ApiError, apiRequest } from "./api-client";

export type UserRole = "user" | "seller" | "admin";
export type InvitableUserRole = Extract<UserRole, "user" | "seller">;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: "pending_email_verification" | "active" | "disabled";
  emailVerifiedAt: string | null;
};

export type AuthResponse = {
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest<AuthResponse>("/auth/me");
    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: "skip" },
  );
}

export async function logout(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(
    "/auth/logout",
    { method: "POST" },
    { auth: "skip" },
  );
}
