import { queryOptions } from "@tanstack/react-query";
import {
  listAuditLogs,
  type AuditLogListParams,
} from "@/services/audit-logs.service";
import { getCurrentUser } from "@/services/auth.service";
import { getHealth } from "@/services/health.service";
import { listMarkets } from "@/services/markets.service";
import {
  listParticipantMasters,
  listParticipants,
} from "@/services/participants.service";
import { listProducts } from "@/services/products.service";
import { getReceipt, listReceipts } from "@/services/receipts.service";
import {
  getGlobalSettlementSettings,
  getMarketSettlementSettings,
} from "@/services/settlement-settings.service";
import {
  getSettlement,
  getSettlementPreview,
  listSettlements,
} from "@/services/settlements.service";
import {
  authKeys,
  auditLogKeys,
  healthKeys,
  marketKeys,
  participantKeys,
  productKeys,
  receiptKeys,
  settlementKeys,
  settlementPreviewKeys,
  settlementSettingsKeys,
} from "@/hooks/query-keys";

function requireQueryValue(value: string | null, message: string): string {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function stableParamsKey(params: AuditLogListParams): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== "")
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
  );
}

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
    retry: false,
  });
}

export function healthQueryOptions() {
  return queryOptions({
    queryKey: healthKeys.status,
    queryFn: getHealth,
  });
}

export function auditLogsQueryOptions(params: AuditLogListParams) {
  return queryOptions({
    queryKey: auditLogKeys.list(stableParamsKey(params)),
    queryFn: () => listAuditLogs(params),
  });
}

export function marketsQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: marketKeys.all,
    queryFn: listMarkets,
    enabled,
  });
}

export function participantMastersQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: participantKeys.masters,
    queryFn: listParticipantMasters,
    enabled,
  });
}

export function participantsByMarketQueryOptions(marketId: string | null) {
  return queryOptions({
    queryKey: participantKeys.byMarket(marketId),
    queryFn: () =>
      listParticipants(requireQueryValue(marketId, "Market is required")),
    enabled: Boolean(marketId),
  });
}

export function productsByMarketParticipantQueryOptions(
  marketId: string | null,
  participantId: string | null,
) {
  return queryOptions({
    queryKey: productKeys.byMarketParticipant(marketId, participantId),
    queryFn: () =>
      listProducts(
        requireQueryValue(marketId, "Market is required"),
        requireQueryValue(participantId, "Participant is required"),
      ),
    enabled: Boolean(marketId && participantId),
  });
}

export function receiptsByMarketQueryOptions(marketId: string | null) {
  return queryOptions({
    queryKey: receiptKeys.byMarket(marketId),
    queryFn: () =>
      listReceipts(requireQueryValue(marketId, "Market is required")),
    enabled: Boolean(marketId),
  });
}

export function receiptDetailQueryOptions(receiptId: string | null) {
  return queryOptions({
    queryKey: receiptKeys.detail(receiptId),
    queryFn: () =>
      getReceipt(requireQueryValue(receiptId, "Receipt is required")),
    enabled: Boolean(receiptId),
  });
}

export function settlementPreviewByMarketQueryOptions(marketId: string | null) {
  return queryOptions({
    queryKey: settlementPreviewKeys.byMarket(marketId),
    queryFn: () =>
      getSettlementPreview(requireQueryValue(marketId, "Market is required")),
    enabled: Boolean(marketId),
  });
}

export function settlementsByMarketQueryOptions(marketId: string | null) {
  return queryOptions({
    queryKey: settlementKeys.byMarket(marketId),
    queryFn: () =>
      listSettlements(requireQueryValue(marketId, "Market is required")),
    enabled: Boolean(marketId),
  });
}

export function settlementDetailQueryOptions(settlementId: string | null) {
  return queryOptions({
    queryKey: settlementKeys.detail(settlementId),
    queryFn: () =>
      getSettlement(requireQueryValue(settlementId, "Settlement is required")),
    enabled: Boolean(settlementId),
  });
}

export function globalSettlementSettingsQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: settlementSettingsKeys.global,
    queryFn: getGlobalSettlementSettings,
    enabled,
  });
}

export function marketSettlementSettingsQueryOptions(marketId: string | null) {
  return queryOptions({
    queryKey: settlementSettingsKeys.market(marketId),
    queryFn: () =>
      getMarketSettlementSettings(
        requireQueryValue(marketId, "Market is required"),
      ),
    enabled: Boolean(marketId),
  });
}
