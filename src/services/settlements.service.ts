import { apiRequest } from "./api-client";
import type {
  CardFeePayer,
  ParticipantType,
  SettlementType,
} from "./participants.service";

export type PaymentAllocationPolicy = "line_net_amount_proportional";

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

export async function getSettlementPreview(
  marketId: string,
): Promise<MarketSettlementPreview> {
  return apiRequest<MarketSettlementPreview>(
    `/markets/${marketId}/settlement-preview`,
  );
}
