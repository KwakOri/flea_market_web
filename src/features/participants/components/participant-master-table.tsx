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
    <>
      <div className="grid gap-3 md:hidden">
        {participants.map((participant) => (
          <ParticipantMasterCard
            isLinked={linkedParticipantIds.has(participant.id)}
            key={participant.id}
            onEditParticipant={onEditParticipant}
            participant={participant}
            showLinkStatus={showLinkStatus}
          />
        ))}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto md:block">
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
                  <ParticipantStatusBadge status={participant.status} />
                </td>
                {showLinkStatus && (
                  <td className="px-4 py-3">
                    {linkedParticipantIds.has(participant.id) ? (
                      <LinkStatusBadge />
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
    </>
  );
}

function ParticipantMasterCard({
  isLinked,
  onEditParticipant,
  participant,
  showLinkStatus,
}: {
  isLinked: boolean;
  onEditParticipant?: (participant: Participant) => void;
  participant: Participant;
  showLinkStatus: boolean;
}) {
  return (
    <article
      className="grid gap-3 rounded-[14px] border border-[#e6e2d4] bg-white p-4"
      data-testid="participant-master-card"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-[#181a12]">
            {participant.displayName}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#f2efe4] px-2 py-1 text-xs font-medium text-[#56564a]">
              {participantTypeLabels[participant.participantType]}
            </span>
            <ParticipantStatusBadge status={participant.status} />
            {showLinkStatus && (isLinked ? <LinkStatusBadge /> : null)}
          </div>
        </div>
        {onEditParticipant && (
          <button
            aria-label={`${participant.displayName} 관리`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#d8d3c2] bg-[#fcfbf6] text-[#1a1b12] transition hover:bg-[#f1eee2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b]"
            onClick={() => onEditParticipant(participant)}
            type="button"
          >
            <Pencil aria-hidden className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <dl className="grid gap-2 text-sm">
        <ParticipantMasterMetric
          label="담당자"
          value={participant.contactName ?? "-"}
        />
        <ParticipantMasterMetric
          label="연락처"
          value={participant.phone ?? "-"}
        />
        <ParticipantMasterMetric
          label="이메일"
          value={participant.email ?? "-"}
        />
        <ParticipantMasterMetric label="메모" value={participant.memo ?? "-"} />
      </dl>
    </article>
  );
}

function ParticipantStatusBadge({ status }: { status: Participant["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-xs font-medium",
        status === "active"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-zinc-100 text-zinc-500",
      )}
    >
      {status === "active" ? "활성" : "비활성"}
    </span>
  );
}

function LinkStatusBadge() {
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
      연결됨
    </span>
  );
}

function ParticipantMasterMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-[10px] bg-[#fcfbf6] px-3 py-2">
      <dt className="text-[#8a8775]">{label}</dt>
      <dd className="truncate font-medium text-[#1a1b12]">{value}</dd>
    </div>
  );
}
