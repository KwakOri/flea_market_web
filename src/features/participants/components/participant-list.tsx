import { Pencil, Trash2 } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import {
  feeSettingScopeLabels,
  formatParticipantFeeFieldDisplay,
  getParticipantFeePolicySource,
} from "@/features/fees/lib/fee-policy";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
import { buttonVariants } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function ParticipantList({
  deleteDisabled = false,
  globalSettings,
  marketSettings,
  participants,
  selectedParticipantId,
  onDeleteParticipant,
  onEditParticipant,
  onSelectParticipant,
  emptyMessage = "등록된 참가부스가 없습니다.",
}: {
  deleteDisabled?: boolean;
  globalSettings: SettlementDefaultSettings | null;
  marketSettings: SettlementDefaultSettings | null;
  participants: Participant[];
  selectedParticipantId: string | null;
  onDeleteParticipant?: (participant: Participant) => void;
  onEditParticipant: (participant: Participant) => void;
  onSelectParticipant: (participantId: string) => void;
  emptyMessage?: string;
}) {
  if (participants.length === 0) {
    return (
      <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-zinc-100 border-t border-zinc-200"
      data-testid="participant-list"
    >
      {participants.map((participant) => {
        const hasMarketSettings = Boolean(marketSettings?.id);
        const activeScope = getParticipantFeePolicySource(
          participant,
          hasMarketSettings,
        );

        return (
          <div
            className={cn(
              "grid gap-3 px-4 py-3 transition hover:bg-emerald-50/50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start",
              selectedParticipantId === participant.id && "bg-emerald-50",
            )}
            data-testid="participant-row"
            key={participant.id}
          >
            <button
              className="min-w-0 text-left"
              onClick={() => onSelectParticipant(participant.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-950">
                    {participant.displayName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {participantTypeLabels[participant.participantType]}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    activeScope === "booth"
                      ? "bg-amber-100 text-amber-800"
                      : activeScope === "market"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-zinc-100 text-zinc-600",
                  )}
                >
                  {feeSettingScopeLabels[activeScope]}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-zinc-500">카드 수수료</dt>
                  <dd className="mt-1 font-medium text-zinc-800">
                    {formatParticipantFeeFieldDisplay(
                      participant,
                      globalSettings,
                      marketSettings,
                      "cardFeeRate",
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">참가비</dt>
                  <dd className="mt-1 font-medium text-zinc-800">
                    {formatParticipantFeeFieldDisplay(
                      participant,
                      globalSettings,
                      marketSettings,
                      "participationFeeAmount",
                    )}
                  </dd>
                </div>
              </dl>
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                aria-label={`${participant.displayName} 수정`}
                className={cn(
                  buttonVariants({ intent: "secondary", size: "sm" }),
                  "h-10 w-10 px-0",
                )}
                onClick={() => onEditParticipant(participant)}
                title="수정"
                type="button"
              >
                <Pencil aria-hidden className="h-4 w-4" />
              </button>
              {onDeleteParticipant && (
                <button
                  aria-label={`${participant.displayName} 삭제`}
                  className={cn(
                    buttonVariants({ intent: "secondary", size: "sm" }),
                    "h-10 w-10 border-red-200 px-0 text-red-700 hover:bg-red-50",
                  )}
                  disabled={deleteDisabled}
                  onClick={() => onDeleteParticipant(participant)}
                  title="삭제"
                  type="button"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
