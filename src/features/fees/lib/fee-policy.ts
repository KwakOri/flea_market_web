import type {
  CardFeePayer,
  Participant,
} from "@/services/participants.service";
import type {
  SettlementDefaultSettings,
  SettlementFeeSettings,
} from "@/services/settlement-settings.service";
import { formatWon } from "@/lib/money";
import {
  FLEA_MARKET_FEE_PAYER_LABEL,
  FLEA_MARKET_SETTINGS_LABEL,
  SELLER_FEE_PAYER_LABEL,
  SELLER_SETTINGS_LABEL,
} from "@/lib/terminology";

export type FeeSettingFieldKey = keyof SettlementFeeSettings;
export type FeeSettingScope = "global" | "market" | "booth";

export const cardFeePayerLabels: Record<CardFeePayer, string> = {
  market: FLEA_MARKET_FEE_PAYER_LABEL,
  participant: SELLER_FEE_PAYER_LABEL,
};

export const feeSettingScopeLabels: Record<FeeSettingScope, string> = {
  global: "전체 설정",
  market: FLEA_MARKET_SETTINGS_LABEL,
  booth: SELLER_SETTINGS_LABEL,
};

export const defaultFeeSettings: SettlementFeeSettings = {
  settlementType: "commission",
  salesCommissionRate: 0,
  cardFeeRate: 0,
  cardFeePayer: "market",
  participationFeeAmount: 0,
};

export const feeSettingFields: Array<{
  key: FeeSettingFieldKey;
  label: string;
}> = [
  { key: "salesCommissionRate", label: "판매" },
  { key: "cardFeeRate", label: "카드" },
  { key: "cardFeePayer", label: "카드 부담" },
  { key: "participationFeeAmount", label: "참가비" },
];

export function getParticipantFeePolicySource(
  participant: Participant,
  hasMarketSettings: boolean,
): FeeSettingScope {
  if (participant.settings?.feeSettingOverrideEnabled) {
    return "booth";
  }

  return hasMarketSettings ? "market" : "global";
}

export function getParticipantFeeFieldPolicySource(
  participant: Participant,
  marketSettings: SettlementDefaultSettings | null | undefined,
  field: FeeSettingFieldKey,
): FeeSettingScope {
  const fieldValue = participant.settings?.[field];

  if (
    participant.settings?.feeSettingOverrideEnabled &&
    fieldValue !== null &&
    fieldValue !== undefined
  ) {
    return "booth";
  }

  return marketSettings?.id ? "market" : "global";
}

export function formatParticipantFeeFieldDisplay(
  participant: Participant,
  globalSettings: SettlementDefaultSettings | null | undefined,
  marketSettings: SettlementDefaultSettings | null | undefined,
  field: FeeSettingFieldKey,
): string {
  const source = getParticipantFeeFieldPolicySource(
    participant,
    marketSettings,
    field,
  );
  const value = getParticipantFeeFieldValue(
    participant,
    globalSettings,
    marketSettings,
    field,
    source,
  );

  return `${feeSettingScopeLabels[source]} ${formatFeeFieldValue(field, value)}`;
}

export function getParticipantFeeFieldValue(
  participant: Participant,
  globalSettings: SettlementDefaultSettings | null | undefined,
  marketSettings: SettlementDefaultSettings | null | undefined,
  field: FeeSettingFieldKey,
  source: FeeSettingScope,
): SettlementFeeSettings[FeeSettingFieldKey] | null {
  if (source === "booth") {
    return participant.settings?.[field] ?? null;
  }

  if (source === "market") {
    return getScopedFeeFieldValue("market", marketSettings, field);
  }

  return getScopedFeeFieldValue("global", globalSettings, field);
}

export function getScopedFeeFieldValue(
  scope: FeeSettingScope,
  settings:
    | SettlementDefaultSettings
    | Participant["settings"]
    | null
    | undefined,
  field: FeeSettingFieldKey,
): SettlementFeeSettings[FeeSettingFieldKey] | null {
  if (!settings) {
    return null;
  }

  if (scope === "booth") {
    return settings[field] ?? null;
  }

  return settings[field] ?? defaultFeeSettings[field];
}

export function formatFeeFieldValue(
  field: FeeSettingFieldKey,
  value: SettlementFeeSettings[FeeSettingFieldKey] | null,
  fallbackScope?: FeeSettingScope,
): string {
  if (value === null || value === undefined) {
    return fallbackScope
      ? `${feeSettingScopeLabels[fallbackScope]} 사용`
      : "미설정";
  }

  switch (field) {
    case "salesCommissionRate":
    case "cardFeeRate":
      return formatPercent(value as number);
    case "cardFeePayer":
      return cardFeePayerLabels[value as CardFeePayer];
    case "participationFeeAmount":
      return formatWon(value as number);
    default:
      return String(value);
  }
}

export function getParticipantFeeSettingsDefaults(
  participant: Participant | null,
): SettlementFeeSettings {
  const settings = participant?.settings;

  if (!settings?.feeSettingOverrideEnabled) {
    return defaultFeeSettings;
  }

  return {
    settlementType: "commission",
    salesCommissionRate:
      settings.salesCommissionRate ?? defaultFeeSettings.salesCommissionRate,
    cardFeeRate: settings.cardFeeRate ?? defaultFeeSettings.cardFeeRate,
    cardFeePayer: settings.cardFeePayer ?? defaultFeeSettings.cardFeePayer,
    participationFeeAmount:
      settings.participationFeeAmount ??
      defaultFeeSettings.participationFeeAmount,
  };
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace(/\.00$/, "")}%`;
}
