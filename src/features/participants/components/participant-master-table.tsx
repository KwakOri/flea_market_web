import { Pencil } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
import { buttonVariants } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function ParticipantMasterTable({
  participants,
  linkedParticipantIds = new Set<string>(),
  onEditParticipant,
  showLinkStatus = true,
}: {
  participants: Participant[];
  linkedParticipantIds?: Set<string>;
  onEditParticipant?: (participant: Participant) => void;
  showLinkStatus?: boolean;
}) {
  if (participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 참가부스가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">부스명</th>
            <th className="px-4 py-3 font-medium">유형</th>
            <th className="px-4 py-3 font-medium">담당자</th>
            <th className="px-4 py-3 font-medium">연락처</th>
            <th className="px-4 py-3 font-medium">이메일</th>
            <th className="px-4 py-3 font-medium">상태</th>
            {showLinkStatus && (
              <th className="px-4 py-3 font-medium">선택 마켓</th>
            )}
            <th className="px-4 py-3 font-medium">메모</th>
            {onEditParticipant && (
              <th className="px-4 py-3 text-right font-medium">관리</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {participants.map((participant) => (
            <tr data-testid="participant-master-row" key={participant.id}>
              <td className="px-4 py-3 font-medium text-zinc-950">
                {participant.displayName}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {participantTypeLabels[participant.participantType]}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {participant.contactName ?? "-"}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {participant.phone ?? "-"}
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 text-zinc-700">
                {participant.email ?? "-"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    participant.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-100 text-zinc-500",
                  )}
                >
                  {participant.status === "active" ? "활성" : "비활성"}
                </span>
              </td>
              {showLinkStatus && (
                <td className="px-4 py-3">
                  {linkedParticipantIds.has(participant.id) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                      연결됨
                    </span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
              )}
              <td className="max-w-[260px] truncate px-4 py-3 text-zinc-600">
                {participant.memo ?? "-"}
              </td>
              {onEditParticipant && (
                <td className="px-4 py-3 text-right">
                  <button
                    className={buttonVariants({
                      intent: "secondary",
                      size: "sm",
                    })}
                    onClick={() => onEditParticipant(participant)}
                    type="button"
                  >
                    <Pencil aria-hidden className="mr-1.5 h-3.5 w-3.5" />
                    관리
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
