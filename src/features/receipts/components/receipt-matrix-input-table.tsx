"use client";

import type { Participant } from "@/services/participants.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { ParticipantTypeBadge } from "@/features/participants/components/participant-type-badge";
import { parseOptionalReceiptAmount } from "@/lib/receipt-matrix";
import { cn } from "@/lib/utils";

export function ReceiptMatrixInputTable({
  participants,
}: {
  participants: Participant[];
}) {
  const amounts = useReceiptMatrixStore((state) => state.receiptAmounts);
  const setReceiptAmount = useReceiptMatrixStore(
    (state) => state.setReceiptAmount,
  );

  if (participants.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-[#8a8775]">
        마켓에 연결된 참가부스가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_96px] bg-[#16170f] px-6 py-3">
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-[#9b9a86]">
            참가 부스
          </span>
          <span className="text-right font-mono text-[10.5px] tracking-[0.08em] text-[#9b9a86]">
            구매 금액
          </span>
          <span className="text-right font-mono text-[10.5px] tracking-[0.08em] text-[#9b9a86]">
            유형
          </span>
        </div>
        <div>
          {participants.map((participant) => {
            const hasAmount =
              (parseOptionalReceiptAmount(amounts[participant.id] ?? "") ?? 0) >
              0;

            return (
              <div
                className={cn(
                  "grid grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_96px] items-center border-b border-[#f1eee2] px-6 py-2.5",
                  hasAmount ? "bg-[#fcfdf7]" : "bg-white",
                )}
                key={participant.id}
              >
                <div
                  className={cn(
                    "text-[14.5px] font-semibold",
                    hasAmount ? "text-[#16170f]" : "text-[#56564a]",
                  )}
                >
                  {participant.displayName}
                </div>
                <div className="flex justify-end">
                  <div
                    className={cn(
                      "flex w-[150px] items-center gap-1 rounded-[9px] border px-3 py-2",
                      hasAmount
                        ? "border-[#16170f] bg-[#f7fbe9]"
                        : "border-[#e6e2d4] bg-[#fcfbf6]",
                    )}
                  >
                    <input
                      className="min-w-0 flex-1 bg-transparent text-right font-display text-[15px] font-bold text-[#16170f] outline-none placeholder:text-[#c4c0ae]"
                      inputMode="numeric"
                      name={`amount-${participant.id}`}
                      onChange={(event) =>
                        setReceiptAmount(participant.id, event.target.value)
                      }
                      placeholder="0"
                      type="text"
                      value={amounts[participant.id] ?? ""}
                    />
                    <span className="text-xs text-[#a8a593]">원</span>
                  </div>
                </div>
                <div className="text-right">
                  <ParticipantTypeBadge type={participant.participantType} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
