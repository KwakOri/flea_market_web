"use client";

import type { FormEventHandler } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Market } from "@/services/markets.service";
import type { Participant } from "@/services/participants.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { ParticipantTypeBadge } from "@/features/participants/components/participant-type-badge";
import {
  getDefaultReceiptDateTimeInputValue,
  getReceiptDateTimeMax,
  getReceiptDateTimeMin,
} from "@/features/receipts/lib/receipt-date-time";
import {
  paymentMethodIcons,
  paymentMethodLabels,
} from "@/features/receipts/lib/payment-method-display";
import {
  parseOptionalReceiptAmount,
  paymentMethods,
  sumReceiptAmounts,
} from "@/lib/receipt-matrix";
import { buttonVariants, inputClass } from "@/lib/design-system";
import { formatWon } from "@/lib/money";
import { cn } from "@/lib/utils";

export function SalesMatrixView({
  isSubmitting,
  onSubmit,
  participants,
  receiptMessage,
  selectedMarket,
  selectedMarketId,
}: {
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  participants: Participant[];
  receiptMessage: string | null;
  selectedMarket: Market | null;
  selectedMarketId: string | null;
}) {
  const receiptAmounts = useReceiptMatrixStore((state) => state.receiptAmounts);
  const receiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.receiptDateTimeDraft,
  );
  const paymentMode = useReceiptMatrixStore((state) => state.paymentMode);
  const singlePaymentMethod = useReceiptMatrixStore(
    (state) => state.singlePaymentMethod,
  );
  const paymentSplits = useReceiptMatrixStore((state) => state.paymentSplits);
  const setReceiptAmount = useReceiptMatrixStore(
    (state) => state.setReceiptAmount,
  );
  const setReceiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.setReceiptDateTimeDraft,
  );
  const clearReceiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.clearReceiptDateTimeDraft,
  );
  const setPaymentMode = useReceiptMatrixStore((state) => state.setPaymentMode);
  const setSinglePaymentMethod = useReceiptMatrixStore(
    (state) => state.setSinglePaymentMethod,
  );
  const setPaymentSplit = useReceiptMatrixStore(
    (state) => state.setPaymentSplit,
  );
  const fillPaymentSplitRemaining = useReceiptMatrixStore(
    (state) => state.fillPaymentSplitRemaining,
  );
  const receiptDateTimeEnabled =
    receiptDateTimeDraft?.marketId === selectedMarketId &&
    receiptDateTimeDraft.enabled;
  const receiptDateTimeValue =
    receiptDateTimeEnabled && receiptDateTimeDraft?.value
      ? receiptDateTimeDraft.value
      : getDefaultReceiptDateTimeInputValue(
          selectedMarket?.startsOn ?? null,
          selectedMarket?.endsOn ?? null,
        );
  const receiptTotal = sumReceiptAmounts(receiptAmounts);
  const paymentSplitTotal = sumReceiptAmounts(paymentSplits);
  const paymentRemaining = Math.max(receiptTotal - paymentSplitTotal, 0);
  const hasParticipants = participants.length > 0;

  return (
    <div>
      <DashboardPageTitle
        eyebrow={selectedMarket?.name ?? "마켓 미선택"}
        subtitle="한 결제 묶음에서 여러 부스 판매 라인을 한 번에 기록합니다."
        title="영수증 입력"
      />
      <form
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
        data-testid="receipt-matrix-form"
        onSubmit={onSubmit}
      >
        <section className="overflow-hidden rounded-[18px] border border-[#e6e2d4] bg-white shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
          <div className="grid gap-4 border-b border-dashed border-[#e0dbca] bg-[#fcfbf6] px-6 py-5 md:grid-cols-[minmax(180px,0.75fr)_minmax(180px,0.75fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.06em] text-[#8a8775]">
                판매 시각
              </div>
              {receiptDateTimeEnabled ? (
                <div className="grid gap-2">
                  <input
                    className={inputClass}
                    disabled={!selectedMarket}
                    id="receipt-sold-at"
                    max={getReceiptDateTimeMax(selectedMarket?.endsOn ?? null)}
                    min={getReceiptDateTimeMin(selectedMarket?.startsOn ?? null)}
                    onChange={(event) =>
                      setReceiptDateTimeDraft({
                        enabled: true,
                        marketId: selectedMarketId,
                        value: event.target.value,
                      })
                    }
                    required
                    type="datetime-local"
                    value={receiptDateTimeValue}
                  />
                  <button
                    className={cn(
                      buttonVariants({ intent: "secondary", size: "sm" }),
                      "w-fit",
                    )}
                    onClick={() => {
                      clearReceiptDateTimeDraft();
                    }}
                    type="button"
                  >
                    현재 시간 사용
                  </button>
                </div>
              ) : (
                <button
                  className={buttonVariants({ intent: "secondary" })}
                  disabled={!selectedMarket}
                  onClick={() => {
                    setReceiptDateTimeDraft({
                      enabled: true,
                      marketId: selectedMarketId,
                      value: getDefaultReceiptDateTimeInputValue(
                        selectedMarket?.startsOn ?? null,
                        selectedMarket?.endsOn ?? null,
                      ),
                    });
                  }}
                  type="button"
                >
                  날짜 직접 설정
                </button>
              )}
            </div>
            <label className="min-w-0">
              <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.06em] text-[#8a8775]">
                구매자
              </span>
              <input
                className={inputClass}
                disabled={!hasParticipants}
                name="customerLabel"
                placeholder="현장 고객"
                type="text"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.06em] text-[#8a8775]">
                메모
              </span>
              <input
                className={inputClass}
                disabled={!hasParticipants}
                name="memo"
                placeholder="묶음 결제 · 요청사항"
                type="text"
              />
            </label>
          </div>

          {receiptMessage && (
            <p className="border-b border-[#f1eee2] px-6 py-3 text-sm font-semibold text-[#cf3d3d]">
              {receiptMessage}
            </p>
          )}

          <ReceiptMatrixInputTable
            amounts={receiptAmounts}
            participants={participants}
            onAmountChange={setReceiptAmount}
          />

          <div className="grid gap-px border-t border-[#e6e2d4] bg-[#e6e2d4] md:grid-cols-3">
            <ReceiptTotalCell
              label="종합 금액"
              testId="receipt-matrix-total"
              value={formatWon(receiptTotal)}
            />
            <ReceiptTotalCell
              label="결제 입력"
              value={formatWon(
                paymentMode === "split" ? paymentSplitTotal : receiptTotal,
              )}
            />
            <ReceiptTotalCell
              accent
              label="남은 금액"
              testId="receipt-matrix-payment-remaining"
              value={formatWon(paymentMode === "split" ? paymentRemaining : 0)}
            />
          </div>
        </section>

        <aside className="grid gap-5">
          <section className="rounded-[18px] border border-[#e6e2d4] bg-white p-5 shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <h3 className="font-display text-[15px] font-bold">
                결제수단 분할
              </h3>
              <div className="inline-flex rounded-[9px] bg-[#f1eee2] p-[3px]">
                <button
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-bold transition",
                    paymentMode === "single"
                      ? "bg-[#c7f94b] text-[#16170f]"
                      : "text-[#8a8775]",
                  )}
                  onClick={() => setPaymentMode("single")}
                  type="button"
                >
                  단일
                </button>
                <button
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-bold transition",
                    paymentMode === "split"
                      ? "bg-[#c7f94b] text-[#16170f]"
                      : "text-[#8a8775]",
                  )}
                  onClick={() => setPaymentMode("split")}
                  type="button"
                >
                  분할
                </button>
              </div>
            </div>

            {paymentMode === "single" ? (
              <div className="grid gap-2">
                {paymentMethods.map((paymentMethod) => {
                  const Icon = paymentMethodIcons[paymentMethod];
                  const isActive = singlePaymentMethod === paymentMethod;

                  return (
                    <button
                      className={cn(
                        "flex items-center gap-2.5 rounded-[11px] border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                        isActive
                          ? "border-[#bfe3cd] bg-[#e6f4ec] text-[#1f6e40]"
                          : "border-[#eee9da] bg-[#fcfbf6] text-[#8a8775] hover:bg-[#f1eee2]",
                      )}
                      disabled={!hasParticipants}
                      key={paymentMethod}
                      onClick={() => setSinglePaymentMethod(paymentMethod)}
                      type="button"
                    >
                      <Icon aria-hidden className="h-4 w-4 flex-none" />
                      <span className="flex-1">
                        {paymentMethodLabels[paymentMethod]}
                      </span>
                      <span className="font-display text-[15px] font-bold">
                        {isActive ? formatWon(receiptTotal) : "0원"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-2">
                {paymentMethods.map((paymentMethod) => {
                  const Icon = paymentMethodIcons[paymentMethod];

                  return (
                    <div
                      className="grid gap-2 rounded-[11px] border border-[#eee9da] bg-[#fcfbf6] p-3"
                      key={paymentMethod}
                    >
                      <label
                        className="flex items-center gap-2 text-sm font-semibold text-[#56564a]"
                        htmlFor={`matrix-payment-${paymentMethod}`}
                      >
                        <Icon
                          aria-hidden="true"
                          className="h-4 w-4 text-[#8a8775]"
                        />
                        {paymentMethodLabels[paymentMethod]}
                      </label>
                      <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-2">
                        <input
                          className={cn(inputClass, "text-right")}
                          disabled={!hasParticipants || receiptTotal <= 0}
                          id={`matrix-payment-${paymentMethod}`}
                          inputMode="numeric"
                          onChange={(event) =>
                            setPaymentSplit(paymentMethod, event.target.value)
                          }
                          placeholder="0"
                          type="text"
                          value={paymentSplits[paymentMethod]}
                        />
                        <button
                          className={cn(
                            buttonVariants({
                              intent: "secondary",
                              size: "sm",
                            }),
                            "h-10 min-w-16 whitespace-nowrap px-3 text-sm",
                          )}
                          disabled={!hasParticipants || receiptTotal <= 0}
                          onClick={() =>
                            fillPaymentSplitRemaining(paymentMethod)
                          }
                          type="button"
                        >
                          잔액
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[18px] bg-[#16170f] p-[22px] text-[#f3f0e2]">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full",
                  paymentMode === "split" && paymentRemaining !== 0
                    ? "bg-[#c47d12]"
                    : "bg-[#1f8a4d]",
                )}
              >
                <CheckCircle2
                  aria-hidden
                  className="h-[18px] w-[18px]"
                  strokeWidth={3}
                />
              </span>
              <div>
                <div className="font-display text-base font-bold">
                  {paymentMode === "split" && paymentRemaining !== 0
                    ? "검증 대기"
                    : "검증 완료"}
                </div>
                <div className="font-mono text-[10.5px] tracking-[0.04em] text-[#8d8c79]">
                  입력 합계 = 결제 합계
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t border-[#2c2d22] py-1.5 text-[12.5px]">
              <span className="text-[#9b9a86]">남은 금액</span>
              <span className="font-display font-bold text-[#c7f94b]">
                {formatWon(paymentMode === "split" ? paymentRemaining : 0)}
              </span>
            </div>
            <button
              className="mt-3.5 w-full rounded-xl border-0 bg-[#c7f94b] p-3 text-[15px] font-bold text-[#16170f] transition hover:bg-[#d4ff5e] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                !hasParticipants ||
                isSubmitting ||
                receiptTotal <= 0 ||
                (paymentMode === "split" && paymentRemaining !== 0)
              }
              type="submit"
            >
              영수증 저장
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}

function ReceiptTotalCell({
  accent = false,
  label,
  testId,
  value,
}: {
  accent?: boolean;
  label: string;
  testId?: string;
  value: string;
}) {
  return (
    <div
      className={cn("px-6 py-4", accent ? "bg-[#e6f4ec]" : "bg-[#fcfbf6]")}
      data-testid={testId}
    >
      <div
        className={cn(
          "font-mono text-[10.5px] tracking-[0.06em]",
          accent ? "text-[#1f8a4d]" : "text-[#8a8775]",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-[22px] font-bold",
          accent ? "text-[#1f8a4d]" : "text-[#1a1b12]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ReceiptMatrixInputTable({
  amounts,
  onAmountChange,
  participants,
}: {
  amounts: Record<string, string>;
  onAmountChange: (participantId: string, amount: string) => void;
  participants: Participant[];
}) {
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
                        onAmountChange(participant.id, event.target.value)
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
