"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useReceipts } from "@/hooks/use-receipts";
import {
  useCreateSettlement,
  useDownloadSettlementPdfArchive,
  useSettlementPreview,
  useSettlements,
} from "@/hooks/use-settlement-preview";
import type { Market } from "@/services/markets.service";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { SettlementPreviewPanel } from "@/features/settlements/components/settlement-preview-panel";
import { panelVariants } from "@/lib/design-system";
import { downloadBlob } from "@/lib/download-blob";
import { getErrorMessage } from "@/lib/error-message";
import { getOptionalFormString } from "@/lib/form-data";

export function SettlementScreen({
  market,
  marketId,
  selectedParticipantId,
  onSaved,
}: {
  market: Market | null;
  marketId: string | null;
  selectedParticipantId: string | null;
  onSaved: (title: string, message: string) => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const receipts = useReceipts(marketId);
  const settlementPreview = useSettlementPreview(marketId);
  const settlementHistory = useSettlements(marketId);
  const createSettlementSnapshot = useCreateSettlement(marketId);
  const downloadSettlementPdfArchive = useDownloadSettlementPdfArchive(marketId);

  async function handleConfirmSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!settlementPreview.data || settlementPreview.data.receiptCount === 0) {
      setMessage("확정할 영수증이 없습니다.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const settlement = await createSettlementSnapshot.mutateAsync({
        memo: getOptionalFormString(formData, "memo"),
      });

      onSaved("정산 확정 완료", `v${settlement.versionNo} 정산이 확정되었습니다.`);
      form.reset();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleDownloadSettlementPdfs() {
    setMessage(null);

    if (!settlementPreview.data || settlementPreview.data.receiptCount === 0) {
      setMessage("저장할 영수증이 없습니다.");
      return;
    }

    try {
      const result = await downloadSettlementPdfArchive.mutateAsync();
      downloadBlob(result.blob, result.filename);
      onSaved("PDF 다운로드 완료", "부스별 정산 PDF를 다운로드했습니다.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div>
      <DashboardPageTitle
        eyebrow={market?.name ?? "마켓 미선택"}
        subtitle="확정 시 현재 정산 결과가 회차 스냅샷으로 저장됩니다."
        title="정산 프리뷰 / 확정"
      />
      <section className={panelVariants()}>
        <SettlementPreviewPanel
          history={settlementHistory.data ?? []}
          isConfirming={createSettlementSnapshot.isPending}
          isDownloading={downloadSettlementPdfArchive.isPending}
          isHistoryLoading={settlementHistory.isLoading}
          isLoading={settlementPreview.isLoading}
          isReceiptsLoading={receipts.isLoading}
          market={market}
          message={message}
          preview={settlementPreview.data ?? null}
          receipts={receipts.data ?? []}
          selectedParticipantId={selectedParticipantId}
          onConfirm={handleConfirmSettlement}
          onDownloadPdfs={handleDownloadSettlementPdfs}
          onBackToParticipantList={() => {
            if (marketId) {
              router.push(`/markets/${marketId}/settlements`);
            }
          }}
          onOpenParticipantDetail={(participantId) => {
            if (marketId) {
              router.push(`/markets/${marketId}/settlements/${participantId}`);
            }
          }}
          onOpenSettlementDetail={(settlementId) => {
            if (marketId) {
              router.push(
                `/markets/${marketId}/settlements/versions/${settlementId}`,
              );
            }
          }}
        />
      </section>
    </div>
  );
}
