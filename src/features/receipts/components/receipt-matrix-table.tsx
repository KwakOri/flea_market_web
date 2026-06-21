"use client";

import { useRef } from "react";
import type { UIEvent } from "react";
import type { Participant } from "@/services/participants.service";
import type { Receipt } from "@/services/receipts.service";
import {
  paymentMethodIcons,
  paymentMethodLabels,
} from "@/features/receipts/lib/payment-method-display";
import { formatWon } from "@/lib/money";

export function ReceiptMatrixTable({
  receipts,
  participants,
}: {
  receipts: Receipt[];
  participants: Participant[];
}) {
  const fixedBodyRef = useRef<HTMLDivElement>(null);
  const boothHeaderRef = useRef<HTMLDivElement>(null);
  const boothBodyRef = useRef<HTMLDivElement>(null);

  if (receipts.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
        등록된 영수증이 없습니다.
      </div>
    );
  }

  const boothGridTemplate = `repeat(${Math.max(
    participants.length,
    1,
  )}, minmax(132px, 132px))`;
  const fixedGridTemplate = "132px 132px 124px 220px 112px";

  function syncReceiptScroll(scrollTop: number, scrollLeft: number) {
    if (fixedBodyRef.current) {
      fixedBodyRef.current.scrollTop = scrollTop;
    }

    if (boothHeaderRef.current) {
      boothHeaderRef.current.scrollLeft = scrollLeft;
    }
  }

  function handleBoothBodyScroll(event: UIEvent<HTMLDivElement>) {
    syncReceiptScroll(
      event.currentTarget.scrollTop,
      event.currentTarget.scrollLeft,
    );
  }

  function handleFixedBodyScroll(event: UIEvent<HTMLDivElement>) {
    const boothBody = boothBodyRef.current;

    if (!boothBody) {
      return;
    }

    boothBody.scrollTop = event.currentTarget.scrollTop;
  }

  function handleBoothHeaderScroll(event: UIEvent<HTMLDivElement>) {
    const boothBody = boothBodyRef.current;

    if (!boothBody) {
      return;
    }

    boothBody.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <div className="grid h-[calc(100vh-260px)] min-h-[320px] min-w-[1040px] max-h-[720px] overflow-hidden grid-cols-[720px_minmax(0,1fr)] grid-rows-[72px_minmax(0,1fr)]">
        <div
          className="z-20 grid items-center border-b border-r border-[#2c2d22] bg-[#16170f] font-mono text-[10.5px] tracking-[0.06em] text-[#9b9a86]"
          style={{ gridTemplateColumns: fixedGridTemplate }}
        >
          <div className="px-4 text-center font-semibold">판매 시각</div>
          <div className="px-4 text-center font-semibold">영수증번호</div>
          <div className="px-4 text-center font-semibold">구매자</div>
          <div className="px-4 text-center font-semibold">결제</div>
          <div className="px-4 text-center font-semibold">합계</div>
        </div>

        <div
          className="scrollbar-hidden min-w-0 overflow-x-auto overflow-y-hidden border-b border-[#2c2d22] bg-[#16170f]"
          data-testid="receipt-booth-header"
          onScroll={handleBoothHeaderScroll}
          ref={boothHeaderRef}
        >
          {participants.length > 0 && (
            <div
              className="grid h-full min-w-max items-center font-mono text-[10.5px] tracking-[0.06em] text-[#9b9a86]"
              style={{ gridTemplateColumns: boothGridTemplate }}
            >
              {participants.map((participant) => (
                <div
                  className="break-keep px-4 text-center font-semibold"
                  key={participant.id}
                >
                  {participant.displayName}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="scrollbar-hidden overflow-x-hidden overflow-y-auto border-r border-[#f1eee2] bg-white"
          data-testid="receipt-fixed-pane"
          onScroll={handleFixedBodyScroll}
          ref={fixedBodyRef}
        >
          <div className="divide-y divide-[#f1eee2]">
            {receipts.map((receipt) => (
              <div
                className="grid h-[88px] items-center text-sm"
                data-testid="receipt-row"
                key={receipt.id}
                style={{ gridTemplateColumns: fixedGridTemplate }}
              >
                <div className="whitespace-nowrap px-4 text-center font-display text-[13px] text-[#56564a]">
                  {formatDateTime(receipt.soldAt)}
                </div>
                <div className="truncate px-4 text-center font-mono text-[11.5px] text-[#8a8775]">
                  {receipt.receiptNo ?? "-"}
                </div>
                <div className="truncate px-4 text-center font-semibold text-[#1a1b12]">
                  {receipt.customerLabel ?? "-"}
                </div>
                <div className="px-4 text-center text-[#56564a]">
                  <ReceiptPaymentSplits receipt={receipt} />
                </div>
                <div className="px-4 text-center font-display text-[15px] font-bold text-[#1a1b12]">
                  {formatWon(receipt.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="min-w-0 overflow-auto bg-white"
          data-testid="receipt-booth-scroll"
          onScroll={handleBoothBodyScroll}
          ref={boothBodyRef}
        >
          {participants.length === 0 ? (
            <div className="flex h-full min-h-[248px] items-center justify-center px-4 text-sm text-[#8a8775]">
              마켓에 연결된 참가부스가 없습니다.
            </div>
          ) : (
            <div className="min-w-max divide-y divide-[#f1eee2]">
              {receipts.map((receipt) => {
                const amountsByParticipant =
                  getReceiptAmountsByParticipant(receipt);

                return (
                  <div
                    className="grid h-[88px] items-center text-sm"
                    key={receipt.id}
                    style={{ gridTemplateColumns: boothGridTemplate }}
                  >
                    {participants.map((participant) => (
                      <div
                        className="px-4 text-center font-display text-[13.5px] text-[#56564a]"
                        key={participant.id}
                      >
                        {formatOptionalWon(
                          amountsByParticipant.get(participant.id) ?? 0,
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceiptPaymentSplits({ receipt }: { receipt: Receipt }) {
  if (receipt.paymentSplits.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {receipt.paymentSplits.map((paymentSplit) => {
        const Icon = paymentMethodIcons[paymentSplit.paymentMethod];

        return (
          <span
            aria-label={`${paymentMethodLabels[paymentSplit.paymentMethod]} ${formatWon(
              paymentSplit.amount,
            )}`}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            key={paymentSplit.id}
          >
            <Icon
              aria-hidden="true"
              className="h-4 w-4 flex-none text-[#8a8775]"
              strokeWidth={2}
            />
            <span>{formatWon(paymentSplit.amount)}</span>
          </span>
        );
      })}
    </div>
  );
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getReceiptAmountsByParticipant(receipt: Receipt): Map<string, number> {
  const amounts = new Map<string, number>();

  for (const saleLine of receipt.saleLines) {
    amounts.set(
      saleLine.participantId,
      (amounts.get(saleLine.participantId) ?? 0) + saleLine.netAmount,
    );
  }

  return amounts;
}

function formatOptionalWon(value: number): string {
  return value > 0 ? formatWon(value) : "-";
}
