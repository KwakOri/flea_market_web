import type { QueryClient } from "@tanstack/react-query";
import {
  authKeys,
  marketKeys,
  participantKeys,
  productKeys,
  receiptKeys,
  settlementKeys,
  settlementPreviewKeys,
  settlementSettingsKeys,
} from "@/hooks/query-keys";

export function setCurrentUserCache<QueryData>(
  queryClient: QueryClient,
  user: QueryData,
) {
  queryClient.setQueryData(authKeys.me, user);
  return queryClient.invalidateQueries({ queryKey: authKeys.me });
}

export function invalidateMarkets(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: marketKeys.all });
}

export function invalidateParticipantMasters(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: participantKeys.masters });
}

export function invalidateParticipantMasterDetail(
  queryClient: QueryClient,
  participantId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: participantKeys.masterDetail(participantId),
  });
}

export function invalidateAllMarketParticipantLists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: participantKeys.marketLists,
  });
}

export function invalidateParticipantsByMarket(
  queryClient: QueryClient,
  marketId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: participantKeys.byMarket(marketId),
  });
}

export function invalidateProductsByMarketParticipant(
  queryClient: QueryClient,
  marketId: string,
  participantId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: productKeys.byMarketParticipant(marketId, participantId),
  });
}

export function invalidateReceiptsByMarket(
  queryClient: QueryClient,
  marketId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: receiptKeys.byMarket(marketId),
  });
}

export function invalidateReceiptDetail(
  queryClient: QueryClient,
  receiptId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: receiptKeys.detail(receiptId),
  });
}

export function invalidateSettlementPreviewByMarket(
  queryClient: QueryClient,
  marketId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: settlementPreviewKeys.byMarket(marketId),
  });
}

export function invalidateSettlementsByMarket(
  queryClient: QueryClient,
  marketId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: settlementKeys.byMarket(marketId),
  });
}

export function invalidateSettlementDetail(
  queryClient: QueryClient,
  settlementId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: settlementKeys.detail(settlementId),
  });
}

export function invalidateGlobalSettlementSettings(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: settlementSettingsKeys.global,
  });
}

export function invalidateMarketSettlementSettings(
  queryClient: QueryClient,
  marketId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: settlementSettingsKeys.market(marketId),
  });
}
