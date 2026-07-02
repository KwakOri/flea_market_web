import type {
  ParticipantType,
  SettlementType,
} from "@/services/participants.service";
import { MANAGER, SELLER, SPECIAL_SELLER } from "@/lib/terminology";

export const participantTypeLabels: Record<ParticipantType, string> = {
  staff: MANAGER,
  seller: SELLER,
  special_booth: SPECIAL_SELLER,
};

export const settlementTypeLabels: Record<SettlementType, string> = {
  commission: "수수료",
  manual: "수기",
  investment: "투자",
};
