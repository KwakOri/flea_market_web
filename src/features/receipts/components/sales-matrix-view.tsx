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
  formKey,
  isSubmitting,
  memoDefaultValue,
  mode = "create",
  onSubmit,
  participants,
  receiptNoDefaultValue,
  receiptMessage,
  selectedMarket,
  selectedMarketId,
}: {
  formKey?: string;
  isSubmitting: boolean;
  memoDefaultValue?: string;
  mode?: "create" | "edit";
  onSubmit: FormEventHandler<HTMLFormElement>;
  participants: Participant[];
  receiptNoDefaultValue?: string;
  receiptMessage: string | null;
  selectedMarket: Market | null;
  selectedMarketId: string | null;
}) {
  const hasParticipants = participants.length > 0;
  const isEditing = mode === "edit";

  return (
    <div className="min-w-0">
      <DashboardPageTitle
        eyebrow={selectedMarket?.name ?? "마켓 미선택"}
        subtitle={
          isEditing
            ? "기존 영수증의 판매 시각, 결제, 부스별 금액을 수정합니다."
            : "한 결제 묶음에서 여러 부스 판매 라인을 한 번에 기록합니다."
        }
        title={isEditing ? "영수증 수정" : "영수증 입력"}
      />
      <form
        className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
        data-testid="receipt-matrix-form"
        key={formKey}
        onSubmit={onSubmit}
      >
        <section className="min-w-0 overflow-hidden rounded-[12px] border border-hairline bg-surface shadow-card">
          <ReceiptDetailsPanel
            hasParticipants={hasParticipants}
            memoDefaultValue={memoDefaultValue}
            receiptNoDefaultValue={receiptNoDefaultValue}
            selectedMarket={selectedMarket}
            selectedMarketId={selectedMarketId}
          />

          {receiptMessage && (
            <p className="border-b border-hairline px-6 py-3 text-sm font-semibold text-error">
              {receiptMessage}
            </p>
          )}

          <ReceiptMatrixInputTable participants={participants} />
          <ReceiptTotalSummary />
        </section>

        <aside className="grid min-w-0 gap-5">
          <ReceiptPaymentPanel hasParticipants={hasParticipants} />
          <ReceiptSubmitPanel
            buttonLabel={isEditing ? "영수증 수정" : "영수증 저장"}
            hasParticipants={hasParticipants}
            isSubmitting={isSubmitting}
          />
        </aside>
      </form>
    </div>
  );
}
