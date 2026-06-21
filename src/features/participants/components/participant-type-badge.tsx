import { cva } from "class-variance-authority";
import type { ParticipantType } from "@/services/participants.service";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";

const participantTypeBadgeVariants = cva(
  "inline-flex rounded-md px-2 py-1 font-mono text-[10.5px] font-semibold",
  {
    variants: {
      type: {
        seller: "bg-[#f1eee2] text-[#8a8775]",
        staff: "bg-[#26271c] text-[#d7d3bf]",
        special_booth: "bg-[#eef9d4] text-[#5c7a16]",
      },
    },
  },
);

export function ParticipantTypeBadge({ type }: { type: ParticipantType }) {
  return (
    <span className={participantTypeBadgeVariants({ type })}>
      {participantTypeLabels[type]}
    </span>
  );
}
