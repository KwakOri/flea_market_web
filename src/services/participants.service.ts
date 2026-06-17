import { apiRequest } from "./api-client";

export type ParticipantType = "staff" | "seller" | "special_booth";
export type ParticipantStatus = "active" | "inactive";
export type SettlementType = "commission" | "manual" | "investment";
export type CardFeePayer = "market" | "participant";

export type ParticipantSettlementSettings = {
  id: string;
  marketParticipantId: string | null;
  participantId: string;
  marketId: string | null;
  settlementType: SettlementType | null;
  salesCommissionRate: number | null;
  cardFeeRate: number | null;
  cardFeePayer: CardFeePayer | null;
  participationFeeAmount: number | null;
  payoutBankName: string | null;
  payoutAccountNumber: string | null;
  payoutAccountHolder: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Participant = {
  id: string;
  marketId: string | null;
  marketParticipantId: string | null;
  displayName: string;
  participantType: ParticipantType;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
  status: ParticipantStatus;
  settings: ParticipantSettlementSettings | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateParticipantPayload = {
  participantId?: string;
  displayName?: string;
  participantType?: ParticipantType;
  contactName?: string;
  phone?: string;
  email?: string;
  memo?: string;
  settlementType?: SettlementType;
  salesCommissionRate?: number;
  cardFeeRate?: number;
  cardFeePayer?: CardFeePayer;
  participationFeeAmount?: number;
};

export async function listParticipantMasters(): Promise<Participant[]> {
  return apiRequest<Participant[]>("/participants");
}

export async function createParticipantMaster(
  payload: CreateParticipantPayload,
): Promise<Participant> {
  return apiRequest<Participant>("/participants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listParticipants(
  marketId: string,
): Promise<Participant[]> {
  return apiRequest<Participant[]>(`/markets/${marketId}/participants`);
}

export async function createParticipant(
  marketId: string,
  payload: CreateParticipantPayload,
): Promise<Participant> {
  return apiRequest<Participant>(`/markets/${marketId}/participants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
