"use client";

import type { Participant } from "@/services/participants.service";
import type { Receipt } from "@/services/receipts.service";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { ReceiptMatrixTable } from "@/features/receipts/components/receipt-matrix-table";
import { panelVariants } from "@/lib/design-system";

export function ReceiptLookupView({
  dateRangeLabel,
  isLoading,
  participants,
  receipts,
}: {
  dateRangeLabel: string;
  isLoading: boolean;
  participants: Participant[];
  receipts: Receipt[];
}) {
  return (
    <div>
      <DashboardPageTitle
        eyebrow={dateRangeLabel}
        subtitle="행과 부스별 기여 금액을 한 화면에서 비교합니다."
        title="영수증 조회"
      />
      <section className={panelVariants()}>
        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
            영수증을 불러오는 중입니다.
          </div>
        ) : (
          <ReceiptMatrixTable participants={participants} receipts={receipts} />
        )}
      </section>
    </div>
  );
}
