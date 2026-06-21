"use client";

import type { FormEventHandler } from "react";
import type { Market } from "@/services/markets.service";
import type { Participant } from "@/services/participants.service";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { ReceiptDetailsPanel } from "@/features/receipts/components/receipt-details-panel";
import { ReceiptMatrixInputTable } from "@/features/receipts/components/receipt-matrix-input-table";
import { ReceiptPaymentPanel } from "@/features/receipts/components/receipt-payment-panel";
import { ReceiptSubmitPanel } from "@/features/receipts/components/receipt-submit-panel";
import { ReceiptTotalSummary } from "@/features/receipts/components/receipt-total-summary";

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
          <ReceiptDetailsPanel
            hasParticipants={hasParticipants}
            selectedMarket={selectedMarket}
            selectedMarketId={selectedMarketId}
          />

          {receiptMessage && (
            <p className="border-b border-[#f1eee2] px-6 py-3 text-sm font-semibold text-[#cf3d3d]">
              {receiptMessage}
            </p>
          )}

          <ReceiptMatrixInputTable participants={participants} />
          <ReceiptTotalSummary />
        </section>

        <aside className="grid gap-5">
          <ReceiptPaymentPanel hasParticipants={hasParticipants} />
          <ReceiptSubmitPanel
            hasParticipants={hasParticipants}
            isSubmitting={isSubmitting}
          />
        </aside>
      </form>
    </div>
  );
}
