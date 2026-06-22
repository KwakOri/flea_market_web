"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuditLogListParams } from "@/services/audit-logs.service";
import { auditLogsQueryOptions } from "@/hooks/query-options";

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery(auditLogsQueryOptions(params));
}
