import { apiRequest } from "./api-client";
import type {
  CardFeePayer,
  SettlementType,
} from "./participants.service";

export type SettlementDefaultScope = "global" | "market";

export type SettlementFeeSettings = {
  settlementType: SettlementType;
  salesCommissionRate: number;
  cardFeeRate: number;
  cardFeePayer: CardFeePayer;
  participationFeeAmount: number;
};

export type SettlementDefaultSettings = SettlementFeeSettings & {
  id: string | null;
  scope: SettlementDefaultScope;
  marketId: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UpdateSettlementFeeSettingsPayload = Partial<SettlementFeeSettings>;

export async function getGlobalSettlementSettings(): Promise<SettlementDefaultSettings> {
  return apiRequest<SettlementDefaultSettings>("/settlement-settings/global");
}

export async function updateGlobalSettlementSettings(
  payload: UpdateSettlementFeeSettingsPayload,
): Promise<SettlementDefaultSettings> {
  return apiRequest<SettlementDefaultSettings>("/settlement-settings/global", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getMarketSettlementSettings(
  marketId: string,
): Promise<SettlementDefaultSettings> {
  return apiRequest<SettlementDefaultSettings>(
    `/markets/${marketId}/settlement-settings`,
  );
}

export async function updateMarketSettlementSettings(
  marketId: string,
  payload: UpdateSettlementFeeSettingsPayload,
): Promise<SettlementDefaultSettings> {
  return apiRequest<SettlementDefaultSettings>(
    `/markets/${marketId}/settlement-settings`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
