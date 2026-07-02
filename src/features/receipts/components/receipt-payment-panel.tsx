"use client";

import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import {
  paymentMethodIcons,
  paymentMethodLabels,
} from "@/features/receipts/lib/payment-method-display";
import { buttonVariants, inputClass } from "@/lib/design-system";
import { formatWon } from "@/lib/money";
import { paymentMethods, sumReceiptAmounts } from "@/lib/receipt-matrix";
import { cn } from "@/lib/utils";

export function ReceiptPaymentPanel({
  hasParticipants,
}: {
  hasParticipants: boolean;
}) {
  const receiptAmounts = useReceiptMatrixStore((state) => state.receiptAmounts);
  const paymentMode = useReceiptMatrixStore((state) => state.paymentMode);
  const singlePaymentMethod = useReceiptMatrixStore(
    (state) => state.singlePaymentMethod,
  );
  const paymentSplits = useReceiptMatrixStore((state) => state.paymentSplits);
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
  const receiptTotal = sumReceiptAmounts(receiptAmounts);

  return (
    <section className="min-w-0 rounded-[12px] border border-hairline bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-3.5 flex min-w-0 items-center justify-between gap-3">
        <h3 className="font-display text-[15px] font-bold">결제수단 분할</h3>
        <div className="inline-flex rounded-[8px] bg-canvas-soft p-[3px]">
          <button
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-bold transition",
              paymentMode === "single"
                ? "bg-brand text-on-brand"
                : "text-muted",
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
                ? "bg-brand text-on-brand"
                : "text-muted",
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
                  "flex items-center gap-2.5 rounded-[8px] border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  isActive
                    ? "border-success/40 bg-success-tint text-success"
                    : "border-hairline bg-surface text-muted hover:bg-canvas-soft",
                )}
                disabled={!hasParticipants}
                key={paymentMethod}
                onClick={() => setSinglePaymentMethod(paymentMethod)}
                type="button"
              >
                <Icon aria-hidden className="h-4 w-4 flex-none" />
                <span className="min-w-0 flex-1 truncate">
                  {paymentMethodLabels[paymentMethod]}
                </span>
                <span className="num shrink-0 text-[15px] font-bold">
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
                className="grid gap-2 rounded-[8px] border border-hairline bg-surface p-3"
                key={paymentMethod}
              >
                <label
                  className="flex min-w-0 items-center gap-2 text-sm font-semibold text-body"
                  htmlFor={`matrix-payment-${paymentMethod}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 text-muted" />
                  <span className="min-w-0 truncate">
                    {paymentMethodLabels[paymentMethod]}
                  </span>
                </label>
                <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-2">
                  <input
                    className={cn(inputClass, "num text-right font-bold")}
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
                    onClick={() => fillPaymentSplitRemaining(paymentMethod)}
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
  );
}
