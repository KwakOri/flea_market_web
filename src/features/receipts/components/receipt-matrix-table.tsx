"use client";

import { useRef } from "react";
import type { UIEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { Receipt } from "@/services/receipts.service";
import {
  paymentMethodIcons,
  paymentMethodLabels,
} from "@/features/receipts/lib/payment-method-display";
import { buttonVariants } from "@/lib/design-system";
import { formatWon } from "@/lib/money";
import { cn } from "@/lib/utils";

export function ReceiptMatrixTable({
  actionsDisabled,
  receipts,
  participants,
  onDeleteReceipt,
  onEditReceipt,
}: {
  actionsDisabled: boolean;
  receipts: Receipt[];
  participants: Participant[];
  onDeleteReceipt: (receipt: Receipt) => void;
  onEditReceipt: (receipt: Receipt) => void;
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
  const fixedGridTemplate = "156px 152px 112px";

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
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {receipts.map((receipt) => (
          <ReceiptMobileCard
            actionsDisabled={actionsDisabled}
            key={receipt.id}
            onDeleteReceipt={onDeleteReceipt}
            onEditReceipt={onEditReceipt}
            participants={participants}
            receipt={receipt}
          />
        ))}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto rounded-t-[18px] md:block">
        <div className="grid h-[calc(100vh-260px)] max-h-[720px] min-h-[320px] min-w-[740px] grid-cols-[420px_minmax(0,1fr)] grid-rows-[72px_minmax(0,1fr)] overflow-hidden rounded-t-[18px]">
          <div
            className="z-20 grid items-center rounded-tl-[18px] border-b border-r border-[#2c2d22] bg-[#16170f] font-mono text-[10.5px] tracking-[0.06em] text-[#9b9a86]"
            style={{ gridTemplateColumns: fixedGridTemplate }}
          >
            <div className="px-4 text-center font-semibold">판매 시각</div>
            <div className="px-4 text-center font-semibold">결제</div>
            <div className="px-4 text-center font-semibold">합계</div>
          </div>

          <div
            className="scrollbar-hidden min-w-0 overflow-x-auto overflow-y-hidden rounded-tr-[18px] border-b border-[#2c2d22] bg-[#16170f]"
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
              {receipts.map((receipt) => {
                return (
                  <div
                    className="grid h-[88px] items-center text-sm"
                    data-testid="receipt-row"
                    key={receipt.id}
                    style={{ gridTemplateColumns: fixedGridTemplate }}
                  >
                    <ReceiptTimeAndNumber
                      actionsDisabled={actionsDisabled}
                      receipt={receipt}
                      onDeleteReceipt={onDeleteReceipt}
                      onEditReceipt={onEditReceipt}
                    />
                    <div className="px-4 text-center text-[#56564a]">
                      <ReceiptPaymentSplits receipt={receipt} />
                    </div>
                    <div className="px-4 text-center font-display text-[15px] font-bold text-[#1a1b12]">
                      {formatWon(receipt.totalAmount)}
                    </div>
                  </div>
                );
              })}
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
    </>
  );
}

function ReceiptMobileCard({
  actionsDisabled,
  onDeleteReceipt,
  onEditReceipt,
  participants,
  receipt,
}: {
  actionsDisabled: boolean;
  onDeleteReceipt: (receipt: Receipt) => void;
  onEditReceipt: (receipt: Receipt) => void;
  participants: Participant[];
  receipt: Receipt;
}) {
  const amountsByParticipant = getReceiptAmountsByParticipant(receipt);
  const participantNameById = new Map(
    participants.map((participant) => [participant.id, participant.displayName]),
  );
  const activeLines = [...amountsByParticipant.entries()].filter(
    ([, amount]) => amount > 0,
  );

  return (
    <article className="grid gap-3 rounded-[16px] border border-[#e6e2d4] bg-white p-4 shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-[#8a8775]">
            {formatReceiptDateTime(receipt.soldAt)}
          </p>
          <h3 className="mt-1 truncate text-[15px] font-semibold text-[#1a1b12]">
            {receipt.receiptNo ?? "영수증번호 없음"}
          </h3>
        </div>
        <p className="shrink-0 text-right font-display text-[17px] font-bold text-[#1a1b12]">
          {formatWon(receipt.totalAmount)}
        </p>
      </div>
      <ReceiptActionButtons
        actionsDisabled={actionsDisabled}
        receipt={receipt}
        onDeleteReceipt={onDeleteReceipt}
        onEditReceipt={onEditReceipt}
      />
      <div className="rounded-[10px] bg-[#fcfbf6] px-3 py-2 text-sm text-[#56564a]">
        <ReceiptPaymentSplits receipt={receipt} />
      </div>
      {activeLines.length === 0 ? (
        <p className="rounded-[10px] bg-[#fcfbf6] px-3 py-3 text-center text-sm text-[#8a8775]">
          부스별 판매 금액이 없습니다.
        </p>
      ) : (
        <dl className="grid gap-1.5">
          {activeLines.map(([participantId, amount]) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] bg-[#fcfbf6] px-3 py-2 text-sm"
              key={participantId}
            >
              <dt className="truncate text-[#56564a]">
                {participantNameById.get(participantId) ?? participantId}
              </dt>
              <dd className="font-display font-semibold text-[#1a1b12]">
                {formatWon(amount)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function ReceiptTimeAndNumber({
  actionsDisabled,
  receipt,
  onDeleteReceipt,
  onEditReceipt,
}: {
  actionsDisabled: boolean;
  receipt: Receipt;
  onDeleteReceipt: (receipt: Receipt) => void;
  onEditReceipt: (receipt: Receipt) => void;
}) {
  return (
    <div className="grid min-w-0 gap-1 px-3 text-center">
      <span className="whitespace-nowrap font-display text-[13px] text-[#56564a]">
        {formatReceiptDateTime(receipt.soldAt)}
      </span>
      <div className="flex min-w-0 items-center justify-center gap-1">
        <span className="min-w-0 max-w-[72px] truncate font-mono text-[11.5px] font-semibold text-[#1a1b12]">
          {receipt.receiptNo ?? "-"}
        </span>
        <ReceiptActionButtons
          actionsDisabled={actionsDisabled}
          compact
          receipt={receipt}
          onDeleteReceipt={onDeleteReceipt}
          onEditReceipt={onEditReceipt}
        />
      </div>
    </div>
  );
}

function ReceiptActionButtons({
  actionsDisabled,
  compact = false,
  receipt,
  onDeleteReceipt,
  onEditReceipt,
}: {
  actionsDisabled: boolean;
  compact?: boolean;
  receipt: Receipt;
  onDeleteReceipt: (receipt: Receipt) => void;
  onEditReceipt: (receipt: Receipt) => void;
}) {
  const receiptLabel = receipt.receiptNo ?? receipt.id;

  return (
    <div className={cn("flex items-center gap-1", compact && "shrink-0")}>
      <button
        aria-label={`영수증 ${receiptLabel} 수정`}
        className={cn(
          buttonVariants({ intent: "secondary", size: "sm" }),
          compact ? "h-6 w-6 rounded-md px-0" : "h-8 w-8 px-0",
        )}
        onClick={() => onEditReceipt(receipt)}
        title="수정"
        type="button"
      >
        <Pencil aria-hidden className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
      <button
        aria-label={`영수증 ${receiptLabel} 삭제`}
        className={cn(
          buttonVariants({ intent: "secondary", size: "sm" }),
          "border-red-200 text-red-700 hover:bg-red-50",
          compact ? "h-6 w-6 rounded-md px-0" : "h-8 w-8 px-0",
        )}
        disabled={actionsDisabled}
        onClick={() => onDeleteReceipt(receipt)}
        title="삭제"
        type="button"
      >
        <Trash2
          aria-hidden
          className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
        />
      </button>
    </div>
  );
}

function ReceiptPaymentSplits({ receipt }: { receipt: Receipt }) {
  if (receipt.paymentSplits.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1.5 md:items-center">
      {receipt.paymentSplits.map((paymentSplit) => {
        const Icon = paymentMethodIcons[paymentSplit.paymentMethod];

        return (
          <span
            aria-label={`${paymentMethodLabels[paymentSplit.paymentMethod]} ${formatWon(
              paymentSplit.amount,
            )}`}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-display text-[13px] leading-none"
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

function formatReceiptDateTime(value: string): string {
  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return `${date.getMonth() + 1}.${date.getDate()} ${String(
      date.getHours(),
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
