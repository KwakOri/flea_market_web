"use client";

import { useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { Receipt } from "@/services/receipts.service";
import {
  paymentMethodIcons,
  paymentMethodLabels,
} from "@/features/receipts/lib/payment-method-display";
import { buttonVariants } from "@/lib/design-system";
import { formatWon } from "@/lib/money";
import { FLEA_MARKET, PARTICIPATING_SELLER, SELLER_SALE_AMOUNT_LABEL } from "@/lib/terminology";
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
      <div className="px-4 py-12 text-center text-sm text-muted">
        등록된 영수증이 없습니다.
      </div>
    );
  }

  const boothGridTemplate = `repeat(${Math.max(
    participants.length,
    1,
  )}, minmax(132px, 132px))`;
  const fixedGridTemplate = "52px 156px 152px 112px";

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
      <div className="hidden min-w-0 max-w-full overflow-x-auto rounded-[12px] md:block">
        <div className="grid h-[calc(100vh-260px)] max-h-[720px] min-h-[320px] min-w-[792px] grid-cols-[472px_minmax(0,1fr)] grid-rows-[72px_minmax(0,1fr)] overflow-hidden rounded-[12px]">
          <div
            className="z-20 grid items-center rounded-tl-[12px] border-b border-r border-hairline bg-surface-sunken text-sm font-medium text-muted"
            style={{ gridTemplateColumns: fixedGridTemplate }}
          >
            <div aria-hidden className="px-2" />
            <div className="px-4 text-center">판매 시각</div>
            <div className="px-4 text-center">결제</div>
            <div className="px-4 text-center">합계</div>
          </div>

          <div
            className="scrollbar-hidden min-w-0 overflow-x-auto overflow-y-hidden rounded-tr-[12px] border-b border-hairline bg-surface-sunken"
            data-testid="receipt-booth-header"
            onScroll={handleBoothHeaderScroll}
            ref={boothHeaderRef}
          >
            {participants.length > 0 && (
              <div
                className="grid h-full min-w-max items-center text-sm font-medium text-muted"
                style={{ gridTemplateColumns: boothGridTemplate }}
              >
                {participants.map((participant) => (
                  <div
                    className="break-keep px-4 text-center"
                    key={participant.id}
                  >
                    {participant.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="scrollbar-hidden overflow-x-hidden overflow-y-auto border-r border-hairline bg-surface"
            data-testid="receipt-fixed-pane"
            onScroll={handleFixedBodyScroll}
            ref={fixedBodyRef}
          >
            <div className="divide-y divide-hairline">
              {receipts.map((receipt) => {
                return (
                  <div
                    className="grid h-[88px] items-center text-sm"
                    data-testid="receipt-row"
                    key={receipt.id}
                    style={{ gridTemplateColumns: fixedGridTemplate }}
                  >
                    <div className="flex h-full items-center justify-center px-2">
                      <ReceiptActionMenu
                        actionsDisabled={actionsDisabled}
                        receipt={receipt}
                        onDeleteReceipt={onDeleteReceipt}
                        onEditReceipt={onEditReceipt}
                      />
                    </div>
                    <ReceiptTimeAndNumber receipt={receipt} />
                    <div className="px-4 text-center text-body">
                      <ReceiptPaymentSplits receipt={receipt} />
                    </div>
                    <div className="px-4 text-center font-display text-[15px] font-bold text-amount-default">
                      {formatWon(receipt.totalAmount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="min-w-0 overflow-auto bg-surface"
            data-testid="receipt-booth-scroll"
            onScroll={handleBoothBodyScroll}
            ref={boothBodyRef}
          >
            {participants.length === 0 ? (
              <div className="flex h-full min-h-[248px] items-center justify-center px-4 text-sm text-muted">
                {FLEA_MARKET}에 연결된 {PARTICIPATING_SELLER}가 없습니다.
              </div>
            ) : (
              <div className="min-w-max divide-y divide-hairline">
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
                          className="px-4 text-center font-display text-[13.5px] text-body"
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
    <article className="grid gap-3 rounded-[12px] border border-hairline bg-surface p-4 shadow-card">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <ReceiptActionMenu
          actionsDisabled={actionsDisabled}
          receipt={receipt}
          onDeleteReceipt={onDeleteReceipt}
          onEditReceipt={onEditReceipt}
        />
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-muted">
            {formatReceiptDateTime(receipt.soldAt)}
          </p>
          <h3 className="mt-1 truncate text-[15px] font-semibold text-ink">
            {receipt.receiptNo ?? "영수증번호 없음"}
          </h3>
        </div>
        <p className="shrink-0 text-right font-display text-[17px] font-bold text-amount-default">
          {formatWon(receipt.totalAmount)}
        </p>
      </div>
      <div className="rounded-[8px] bg-canvas-soft px-3 py-2 text-sm text-body">
        <ReceiptPaymentSplits receipt={receipt} />
      </div>
      {activeLines.length === 0 ? (
        <p className="rounded-[8px] bg-canvas-soft px-3 py-3 text-center text-sm text-muted">
          {SELLER_SALE_AMOUNT_LABEL}이 없습니다.
        </p>
      ) : (
        <dl className="grid gap-1.5">
          {activeLines.map(([participantId, amount]) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[8px] bg-canvas-soft px-3 py-2 text-sm"
              key={participantId}
            >
              <dt className="truncate text-body">
                {participantNameById.get(participantId) ?? participantId}
              </dt>
              <dd className="font-display font-semibold text-amount-default">
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
  receipt,
}: {
  receipt: Receipt;
}) {
  return (
    <div className="grid min-w-0 gap-1 px-3 text-center">
      <span className="whitespace-nowrap font-display text-[13px] text-body">
        {formatReceiptDateTime(receipt.soldAt)}
      </span>
      <span className="min-w-0 truncate font-mono text-[11.5px] font-semibold text-ink">
        {receipt.receiptNo ?? "-"}
      </span>
    </div>
  );
}

function ReceiptActionMenu({
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const receiptLabel = receipt.receiptNo ?? receipt.id;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleMouseDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      ref={menuRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`영수증 ${receiptLabel} 작업 메뉴`}
        className={cn(
          buttonVariants({ intent: "secondary", size: "sm" }),
          "h-8 w-8 rounded-md px-0",
        )}
        onClick={() => setIsOpen((open) => !open)}
        title="작업"
        type="button"
      >
        <MoreHorizontal aria-hidden className="h-4 w-4" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-28 overflow-hidden rounded-[8px] border border-border bg-surface-raised py-1 text-sm shadow-popover"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-body transition hover:bg-canvas-soft hover:text-ink"
            onClick={() => {
              setIsOpen(false);
              onEditReceipt(receipt);
            }}
            role="menuitem"
            type="button"
          >
            <Pencil aria-hidden className="h-3.5 w-3.5" />
            수정
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-error transition hover:bg-error-tint disabled:cursor-not-allowed disabled:opacity-50"
            disabled={actionsDisabled}
            onClick={() => {
              setIsOpen(false);
              onDeleteReceipt(receipt);
            }}
            role="menuitem"
            type="button"
          >
            <Trash2 aria-hidden className="h-3.5 w-3.5" />
            삭제
          </button>
        </div>
      )}
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
              className="h-4 w-4 flex-none text-muted"
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
