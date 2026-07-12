import { apiRequest } from "./api-client";
import type { AuthResponse } from "./auth.service";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type Invitation = {
  id: string;
  email: string;
  status: InvitationStatus;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdByUserId: string | null;
  acceptedByUserId: string | null;
};

export type CreatedInvitation = Invitation & {
  inviteUrl: string;
};

export type InvitationValidation = {
  emailHint: string;
  expiresAt: string;
};

export type AcceptInvitationPayload = {
  displayName: string;
  password: string;
  token: string;
};

export function listInvitations(): Promise<Invitation[]> {
  return apiRequest<Invitation[]>("/auth/invitations");
}

export function createInvitation(email: string): Promise<CreatedInvitation> {
  return apiRequest<CreatedInvitation>("/auth/invitations", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function revokeInvitation(invitationId: string): Promise<Invitation> {
  return apiRequest<Invitation>(
    `/auth/invitations/${encodeURIComponent(invitationId)}/revoke`,
    { method: "POST" },
  );
}

export function validateInvitation(
  token: string,
): Promise<InvitationValidation> {
  return apiRequest<InvitationValidation>("/auth/invitations/validate", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function acceptInvitation(
  payload: AcceptInvitationPayload,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/invitations/accept", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
