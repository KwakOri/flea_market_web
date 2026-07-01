"use client";

import type { Participant } from "@/services/participants.service";
import type { Receipt } from "@/services/receipts.service";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { ReceiptMatrixTable } from "@/features/receipts/components/receipt-matrix-table";
import { panelVariants } from "@/lib/design-system";

export function ReceiptLookupView({
  dateRangeLabel,
  isDeletingReceipt,
  isLoading,
  participants,
  receiptMessage,
  receipts,
  onDeleteReceipt,
  onEditReceipt,
}: {
  dateRangeLabel: string;
  isDeletingReceipt: boolean;
  isLoading: boolean;
  participants: Participant[];
  receiptMessage: string | null;
  receipts: Receipt[];
  onDeleteReceipt: (receipt: Receipt) => void;
  onEditReceipt: (receipt: Receipt) => void;
}) {
  return (
    <div>
      <DashboardPageTitle
        eyebrow={dateRangeLabel}
        subtitle="행과 부스별 기여 금액을 한 화면에서 비교합니다."
        title="영수증 조회"
      />
      <section className={panelVariants()}>
        {receiptMessage && (
          <p className="border-b border-hairline px-5 py-3 text-sm font-semibold text-error">
            {receiptMessage}
          </p>
        )}
        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-muted">
            영수증을 불러오는 중입니다.
          </div>
        ) : (
          <ReceiptMatrixTable
            actionsDisabled={isDeletingReceipt}
            participants={participants}
            receipts={receipts}
            onDeleteReceipt={onDeleteReceipt}
            onEditReceipt={onEditReceipt}
          />
        )}
      </section>
    </div>
  );
}
