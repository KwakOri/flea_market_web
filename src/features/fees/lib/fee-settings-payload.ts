import type { CardFeePayer } from "@/services/participants.service";
import type { UpdateSettlementFeeSettingsPayload } from "@/services/settlement-settings.service";
import { getFormString, getNumber } from "@/lib/form-data";

export function getFeeSettingsPayload(
  formData: FormData,
): UpdateSettlementFeeSettingsPayload {
  return {
    settlementType: "commission",
    salesCommissionRate: getPercentRate(formData, "salesCommissionPercent") ?? 0,
    cardFeeRate: getPercentRate(formData, "cardFeePercent") ?? 0,
    cardFeePayer: getFormString(formData, "cardFeePayer") as CardFeePayer,
    participationFeeAmount: getNumber(formData, "participationFeeAmount") ?? 0,
  };
}

function getPercentRate(formData: FormData, name: string): number | undefined {
  const value = getNumber(formData, name);
  return value === undefined ? undefined : value / 100;
}
