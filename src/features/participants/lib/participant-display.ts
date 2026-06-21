import type {
  ParticipantType,
  SettlementType,
} from "@/services/participants.service";

export const participantTypeLabels: Record<ParticipantType, string> = {
  staff: "운영진",
  seller: "셀러",
  special_booth: "특수 부스",
};

export const settlementTypeLabels: Record<SettlementType, string> = {
  commission: "수수료",
  manual: "수기",
  investment: "투자",
};
