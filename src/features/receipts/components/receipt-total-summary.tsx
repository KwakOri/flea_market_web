"use client";

import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { sumReceiptAmounts } from "@/lib/receipt-matrix";
import { formatWon } from "@/lib/money";
import { cn } from "@/lib/utils";

export function ReceiptTotalSummary() {
  const receiptAmounts = useReceiptMatrixStore((state) => state.receiptAmounts);
  const paymentMode = useReceiptMatrixStore((state) => state.paymentMode);
  const paymentSplits = useReceiptMatrixStore((state) => state.paymentSplits);
  const receiptTotal = sumReceiptAmounts(receiptAmounts);
  const paymentSplitTotal = sumReceiptAmounts(paymentSplits);
  const paymentRemaining = Math.max(receiptTotal - paymentSplitTotal, 0);

  return (
    <div className="grid min-w-0 gap-px border-t border-[#e6e2d4] bg-[#e6e2d4] md:grid-cols-3">
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
      className={cn(
        "min-w-0 px-4 py-4 sm:px-6",
        accent ? "bg-[#e6f4ec]" : "bg-[#fcfbf6]",
      )}
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
          "num mt-1 truncate text-[22px] font-bold",
          accent ? "text-[#1f8a4d]" : "text-[#1a1b12]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
