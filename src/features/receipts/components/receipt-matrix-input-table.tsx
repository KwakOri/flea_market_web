"use client";

import type { Participant } from "@/services/participants.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { ParticipantTypeBadge } from "@/features/participants/components/participant-type-badge";
import { parseOptionalReceiptAmount } from "@/lib/receipt-matrix";
import { cn } from "@/lib/utils";

const amountInputFrameClass =
  "flex w-[140px] items-center justify-end gap-[3px] rounded-[9px] border-[1.5px] px-3 py-2 transition-colors focus-within:border-[#16170f] focus-within:bg-[#f7fbe9]";

const amountInputClass =
  "num min-w-0 flex-1 bg-transparent text-right text-[15px] font-bold outline-none placeholder:text-[#c4c0ae]";

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
    <>
      <div className="grid gap-2 p-3 md:hidden">
        {participants.map((participant) => (
          <ReceiptMatrixInputCard
            key={participant.id}
            participant={participant}
          />
        ))}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto md:block">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_96px] bg-[#16170f] px-6 py-[11px]">
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
                (parseOptionalReceiptAmount(amounts[participant.id] ?? "") ??
                  0) > 0;

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
                        amountInputFrameClass,
                        hasAmount
                          ? "border-[#16170f] bg-[#f7fbe9]"
                          : "border-[#e6e2d4] bg-[#fcfbf6]",
                      )}
                    >
                      <input
                        className={cn(
                          amountInputClass,
                          hasAmount ? "text-[#16170f]" : "text-[#c4c0ae]",
                        )}
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
    </>
  );
}

function ReceiptMatrixInputCard({ participant }: { participant: Participant }) {
  const amount = useReceiptMatrixStore(
    (state) => state.receiptAmounts[participant.id] ?? "",
  );
  const setReceiptAmount = useReceiptMatrixStore(
    (state) => state.setReceiptAmount,
  );
  const hasAmount = (parseOptionalReceiptAmount(amount) ?? 0) > 0;

  return (
    <article
      className={cn(
        "grid gap-3 rounded-[14px] border px-3 py-3",
        hasAmount
          ? "border-[#c7f94b] bg-[#fcfdf7]"
          : "border-[#e6e2d4] bg-white",
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[14.5px] font-semibold",
              hasAmount ? "text-[#16170f]" : "text-[#56564a]",
            )}
          >
            {participant.displayName}
          </p>
          <p className="mt-1">
            <ParticipantTypeBadge type={participant.participantType} />
          </p>
        </div>
        <div
          className={cn(
            amountInputFrameClass,
            "shrink-0",
            hasAmount
              ? "border-[#16170f] bg-[#f7fbe9]"
              : "border-[#e6e2d4] bg-[#fcfbf6]",
          )}
        >
          <input
            className={cn(
              amountInputClass,
              hasAmount ? "text-[#16170f]" : "text-[#c4c0ae]",
            )}
            inputMode="numeric"
            name={`mobile-amount-${participant.id}`}
            onChange={(event) =>
              setReceiptAmount(participant.id, event.target.value)
            }
            placeholder="0"
            type="text"
            value={amount}
          />
          <span className="text-xs text-[#a8a593]">원</span>
        </div>
      </div>
    </article>
  );
}
