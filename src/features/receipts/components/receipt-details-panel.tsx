"use client";

import type { Market } from "@/services/markets.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import {
  getDefaultReceiptDateTimeInputValue,
  getReceiptDateTimeMax,
  getReceiptDateTimeMin,
} from "@/features/receipts/lib/receipt-date-time";
import { buttonVariants, inputClass } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function ReceiptDetailsPanel({
  hasParticipants,
  memoDefaultValue,
  receiptNoDefaultValue,
  selectedMarket,
  selectedMarketId,
}: {
  hasParticipants: boolean;
  memoDefaultValue?: string;
  receiptNoDefaultValue?: string;
  selectedMarket: Market | null;
  selectedMarketId: string | null;
}) {
  const receiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.receiptDateTimeDraft,
  );
  const setReceiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.setReceiptDateTimeDraft,
  );
  const clearReceiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.clearReceiptDateTimeDraft,
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

  return (
    <div className="grid min-w-0 gap-4 border-b border-dashed border-border bg-surface px-4 py-5 sm:px-6 md:grid-cols-[minmax(180px,0.75fr)_minmax(180px,0.75fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.06em] text-muted">
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
        <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.06em] text-muted">
          영수증 번호
        </span>
        <input
          className={inputClass}
          defaultValue={receiptNoDefaultValue}
          disabled={!hasParticipants}
          maxLength={80}
          name="receiptNo"
          placeholder="R1"
          required
          type="text"
        />
      </label>
      <label className="min-w-0">
        <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.06em] text-muted">
          메모
        </span>
        <input
          className={inputClass}
          defaultValue={memoDefaultValue}
          disabled={!hasParticipants}
          name="memo"
          placeholder="묶음 결제 · 요청사항"
          type="text"
        />
      </label>
    </div>
  );
}
