"use client";

import { CheckCircle2 } from "lucide-react";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { sumReceiptAmounts } from "@/lib/receipt-matrix";
import { formatWon } from "@/lib/money";
import { cn } from "@/lib/utils";

export function ReceiptSubmitPanel({
  hasParticipants,
  isSubmitting,
}: {
  hasParticipants: boolean;
  isSubmitting: boolean;
}) {
  const receiptAmounts = useReceiptMatrixStore((state) => state.receiptAmounts);
  const paymentMode = useReceiptMatrixStore((state) => state.paymentMode);
  const paymentSplits = useReceiptMatrixStore((state) => state.paymentSplits);
  const receiptTotal = sumReceiptAmounts(receiptAmounts);
  const paymentSplitTotal = sumReceiptAmounts(paymentSplits);
  const paymentRemaining = Math.max(receiptTotal - paymentSplitTotal, 0);
  const waitingForSplitAmount = paymentMode === "split" && paymentRemaining !== 0;

  return (
    <section className="min-w-0 rounded-[18px] bg-[#16170f] p-5 text-[#f3f0e2] sm:p-[22px]">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full",
            waitingForSplitAmount ? "bg-[#c47d12]" : "bg-[#1f8a4d]",
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
            {waitingForSplitAmount ? "검증 대기" : "검증 완료"}
          </div>
          <div className="font-mono text-[10.5px] tracking-[0.04em] text-[#8d8c79]">
            입력 합계 = 결제 합계
          </div>
        </div>
      </div>
      <div className="flex min-w-0 justify-between gap-3 border-t border-[#2c2d22] py-1.5 text-[12.5px]">
        <span className="text-[#9b9a86]">남은 금액</span>
        <span className="truncate font-display font-bold text-[#c7f94b]">
          {formatWon(paymentMode === "split" ? paymentRemaining : 0)}
        </span>
      </div>
      <button
        className="mt-3.5 w-full rounded-xl border-0 bg-[#c7f94b] p-3 text-[15px] font-bold text-[#16170f] transition hover:bg-[#d4ff5e] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={
          !hasParticipants ||
          isSubmitting ||
          receiptTotal <= 0 ||
          waitingForSplitAmount
        }
        type="submit"
      >
        영수증 저장
      </button>
    </section>
  );
}
