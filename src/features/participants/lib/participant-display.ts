import type { ParticipantType } from "@/services/participants.service";

export const participantTypeLabels: Record<ParticipantType, string> = {
  staff: "운영진",
  seller: "셀러",
  special_booth: "특수 부스",
};
