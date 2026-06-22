import { apiRequest } from "./api-client";

export type AuditLogCategory =
  | "auth_security"
  | "market"
  | "booth"
  | "product"
  | "receipt"
  | "fee_policy"
  | "settlement"
  | "export"
  | "admin"
  | "system";

export type AuditLogAction =
  | "register"
  | "login"
  | "logout"
  | "access_denied"
  | "create"
  | "update"
  | "remove"
  | "confirm"
  | "void"
  | "download"
  | "view";

export type AuditLogResult = "success" | "failure";

export type AuditLog = {
  id: string;
  occurredAt: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  actorRole: "user" | "admin" | null;
  category: AuditLogCategory;
  action: AuditLogAction;
  result: AuditLogResult;
  marketId: string | null;
  targetType: string | null;
  targetId: string | null;
  summary: string;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
};

export type AuditLogListResponse = {
  logs: AuditLog[];
};

export type AuditLogListParams = {
  action?: AuditLogAction | "";
  category?: AuditLogCategory | "";
  from?: string;
  limit?: number;
  marketId?: string;
  result?: AuditLogResult | "";
  search?: string;
  to?: string;
};

export async function listAuditLogs(
  params: AuditLogListParams,
): Promise<AuditLogListResponse> {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return apiRequest<AuditLogListResponse>(
    `/audit-logs${query ? `?${query}` : ""}`,
  );
}
