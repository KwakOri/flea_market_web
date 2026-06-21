"use client";

import type { FormEvent } from "react";
import { Download } from "lucide-react";
import type { Market } from "@/services/markets.service";
import type { Receipt } from "@/services/receipts.service";
import type {
  MarketSettlementPreview,
  SettlementListItem,
} from "@/services/settlements.service";
import { ParticipantDailySalesDetail } from "@/features/settlements/components/participant-daily-sales-detail";
import { ParticipantSettlementDualChart } from "@/features/settlements/components/participant-settlement-dual-chart";
import { SettlementHistoryPanel } from "@/features/settlements/components/settlement-history-panel";
import { SettlementMetric } from "@/features/settlements/components/settlement-metric";
import { SettlementPreviewTable } from "@/features/settlements/components/settlement-preview-table";
import { buttonVariants, inputClass } from "@/lib/design-system";
import { formatWon } from "@/lib/money";

export function SettlementPreviewPanel({
  preview,
  history,
  isLoading,
  isReceiptsLoading,
  isHistoryLoading,
  isConfirming,
  isDownloading,
  market,
  message,
  receipts,
  selectedParticipantId,
  onConfirm,
  onDownloadPdfs,
  onBackToParticipantList,
  onOpenParticipantDetail,
  onOpenSettlementDetail,
}: {
  preview: MarketSettlementPreview | null;
  history: SettlementListItem[];
  isLoading: boolean;
  isReceiptsLoading: boolean;
  isHistoryLoading: boolean;
  isConfirming: boolean;
  isDownloading: boolean;
  market: Market | null;
  message: string | null;
  receipts: Receipt[];
  selectedParticipantId: string | null;
  onConfirm: (event: FormEvent<HTMLFormElement>) => void;
  onDownloadPdfs: () => void;
  onBackToParticipantList: () => void;
  onOpenParticipantDetail: (participantId: string) => void;
  onOpenSettlementDetail: (settlementId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        정산 데이터를 불러오는 중입니다.
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        마켓을 선택하면 정산 미리보기가 표시됩니다.
      </div>
    );
  }

  if (preview.participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 참가부스가 없습니다.
      </div>
    );
  }

  const selectedParticipant = selectedParticipantId
    ? (preview.participants.find(
        (participant) => participant.participantId === selectedParticipantId,
      ) ?? null)
    : null;

  return (
    <div className="grid min-w-0 gap-[18px] p-0">
      <dl className="grid min-w-0 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <SettlementMetric
          label="총매출"
          tone="dark"
          value={formatWon(preview.netSalesAmount)}
        />
        <SettlementMetric
          label="판매 수수료"
          value={formatWon(preview.salesCommissionAmount)}
        />
        <SettlementMetric
          label="참가부스 부담 카드 수수료"
          tone="blue"
          value={formatWon(preview.cardFeeChargedToParticipantAmount)}
        />
        <SettlementMetric
          label="마켓 부담 카드 수수료"
          tone="amber"
          value={formatWon(preview.cardFeePaidByMarketAmount)}
        />
        <SettlementMetric
          label="지급 예정"
          tone="green"
          value={formatWon(preview.participantPayoutAmount)}
        />
      </dl>
      <form
        className="grid min-w-0 gap-3 rounded-[16px] border border-[#e6e2d4] bg-white p-3.5 shadow-[0_1px_3px_rgba(26,27,18,0.05)] md:grid-cols-[minmax(0,1fr)_auto_auto]"
        data-testid="settlement-confirm-form"
        onSubmit={onConfirm}
      >
        <input
          className={inputClass}
          disabled={isConfirming || preview.receiptCount === 0}
          name="memo"
          placeholder="확정 메모 (예: 5월 정산 최종 확정)"
          type="text"
        />
        <button
          className={buttonVariants({ intent: "secondary" })}
          data-testid="settlement-pdf-download"
          disabled={isDownloading || preview.receiptCount === 0}
          onClick={onDownloadPdfs}
          type="button"
        >
          <Download aria-hidden className="mr-2 h-4 w-4" />
          {isDownloading ? "저장 중" : "부스별 PDF 저장"}
        </button>
        <button
          className={buttonVariants()}
          data-testid="settlement-confirm-submit"
          disabled={isConfirming || preview.receiptCount === 0}
          type="submit"
        >
          정산 확정
        </button>
        {message && (
          <p className="text-sm font-semibold text-[#cf3d3d] md:col-span-3">
            {message}
          </p>
        )}
      </form>
      {selectedParticipantId ? (
        <ParticipantDailySalesDetail
          isReceiptsLoading={isReceiptsLoading}
          market={market}
          participant={selectedParticipant}
          receipts={receipts}
          onBackToList={onBackToParticipantList}
        />
      ) : (
        <ParticipantSettlementDualChart participants={preview.participants} />
      )}
      {!selectedParticipantId && (
        <>
          <SettlementPreviewTable
            participants={preview.participants}
            onOpenParticipantDetail={onOpenParticipantDetail}
          />
          <SettlementHistoryPanel
            history={history}
            isLoading={isHistoryLoading}
            onOpenSettlementDetail={onOpenSettlementDetail}
          />
        </>
      )}
    </div>
  );
}
