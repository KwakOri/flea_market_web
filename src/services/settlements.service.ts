import { apiDownload, apiRequest, type ApiDownloadResult } from "./api-client";
import type {
  CardFeePayer,
  ParticipantType,
  SettlementType,
} from "./participants.service";

export type PaymentAllocationPolicy = "line_net_amount_proportional";
export type SettlementStatus = "confirmed" | "superseded" | "voided";
export type SettlementChangeType =
  | "initial_confirmation"
  | "revision_confirmation"
  | "manual_note";
export type SettlementAmountDeltas = Partial<
  Record<
    | "grossSalesAmount"
    | "discountAmount"
    | "netSalesAmount"
    | "cashSalesAmount"
    | "cardSalesAmount"
    | "transferSalesAmount"
    | "otherSalesAmount"
    | "salesCommissionAmount"
    | "cardFeeAmount"
    | "cardFeeChargedToParticipantAmount"
    | "cardFeePaidByMarketAmount"
    | "participationFeeAmount"
    | "marketIncomeAmount"
    | "marketCostAmount"
    | "marketProfitAmount"
    | "participantPayoutAmount",
    number
  >
>;

export type ParticipantSettlementPreview = {
  participantId: string;
  displayName: string;
  participantType: ParticipantType;
  settlementType: SettlementType;
  receiptCount: number;
  saleLineCount: number;
  grossSalesAmount: number;
  discountAmount: number;
  netSalesAmount: number;
  cashSalesAmount: number;
  cardSalesAmount: number;
  transferSalesAmount: number;
  otherSalesAmount: number;
  salesCommissionRate: number;
  salesCommissionAmount: number;
  cardFeeRate: number;
  cardFeePayer: CardFeePayer;
  cardFeeAmount: number;
  cardFeeChargedToParticipantAmount: number;
  cardFeePaidByMarketAmount: number;
  participationFeeAmount: number;
  payoutAmount: number;
};

export type MarketSettlementPreview = {
  marketId: string;
  generatedAt: string;
  allocationPolicy: PaymentAllocationPolicy;
  participantCount: number;
  receiptCount: number;
  saleLineCount: number;
  grossSalesAmount: number;
  discountAmount: number;
  netSalesAmount: number;
  cashSalesAmount: number;
  cardSalesAmount: number;
  transferSalesAmount: number;
  otherSalesAmount: number;
  salesCommissionAmount: number;
  cardFeeAmount: number;
  cardFeeChargedToParticipantAmount: number;
  cardFeePaidByMarketAmount: number;
  participationFeeAmount: number;
  marketIncomeAmount: number;
  marketCostAmount: number;
  marketProfitAmount: number;
  participantPayoutAmount: number;
  participants: ParticipantSettlementPreview[];
};

export type SettlementListItem = {
  id: string;
  marketId: string;
  versionNo: number;
  baseSettlementId: string | null;
  status: SettlementStatus;
  allocationPolicy: PaymentAllocationPolicy;
  participantCount: number;
  receiptCount: number;
  saleLineCount: number;
  grossSalesAmount: number;
  discountAmount: number;
  netSalesAmount: number;
  cashSalesAmount: number;
  cardSalesAmount: number;
  transferSalesAmount: number;
  otherSalesAmount: number;
  salesCommissionAmount: number;
  cardFeeAmount: number;
  cardFeeChargedToParticipantAmount: number;
  cardFeePaidByMarketAmount: number;
  participationFeeAmount: number;
  marketIncomeAmount: number;
  marketCostAmount: number;
  marketProfitAmount: number;
  participantPayoutAmount: number;
  memo: string | null;
  confirmedBy: string | null;
  confirmedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SettlementParticipantSnapshot = {
  id: string;
  settlementId: string;
  participantId: string | null;
  displayName: string;
  participantType: ParticipantType;
  settlementType: SettlementType;
  receiptCount: number;
  saleLineCount: number;
  grossSalesAmount: number;
  discountAmount: number;
  netSalesAmount: number;
  cashSalesAmount: number;
  cardSalesAmount: number;
  transferSalesAmount: number;
  otherSalesAmount: number;
  salesCommissionRate: number;
  salesCommissionAmount: number;
  cardFeeRate: number;
  cardFeePayer: CardFeePayer;
  cardFeeAmount: number;
  cardFeeChargedToParticipantAmount: number;
  cardFeePaidByMarketAmount: number;
  participationFeeAmount: number;
  payoutAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type SettlementChange = {
  id: string;
  settlementId: string;
  baseSettlementId: string | null;
  changeType: SettlementChangeType;
  description: string | null;
  amountDeltas: SettlementAmountDeltas;
  createdBy: string | null;
  createdAt: string;
};

export type Settlement = SettlementListItem & {
  participants: SettlementParticipantSnapshot[];
  changes: SettlementChange[];
};

export type CreateSettlementPayload = {
  memo?: string;
};

export async function getSettlementPreview(
  marketId: string,
): Promise<MarketSettlementPreview> {
  return apiRequest<MarketSettlementPreview>(
    `/markets/${marketId}/settlement-preview`,
  );
}

export async function listSettlements(
  marketId: string,
): Promise<SettlementListItem[]> {
  return apiRequest<SettlementListItem[]>(`/markets/${marketId}/settlements`);
}

export async function createSettlement(
  marketId: string,
  payload: CreateSettlementPayload,
): Promise<Settlement> {
  return apiRequest<Settlement>(`/markets/${marketId}/settlements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSettlement(settlementId: string): Promise<Settlement> {
  return apiRequest<Settlement>(`/settlements/${settlementId}`);
}

export async function downloadSettlementPdfArchive(
  marketId: string,
): Promise<ApiDownloadResult> {
  return apiDownload(
    `/markets/${marketId}/settlement-pdfs`,
    `settlement-${marketId}.zip`,
  );
}
