"use client";

import type { FormEvent } from "react";
import { ArrowLeft, Download } from "lucide-react";
import type { Market } from "@/services/markets.service";
import type { Receipt } from "@/services/receipts.service";
import type {
  MarketSettlementPreview,
  ParticipantSettlementPreview,
  SettlementListItem,
} from "@/services/settlements.service";
import { formatPercent } from "@/features/fees/lib/fee-policy";
import { ParticipantTypeBadge } from "@/features/participants/components/participant-type-badge";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
import {
  buildParticipantDailySales,
  type ParticipantDailySalesPoint,
} from "@/features/settlements/lib/settlement-daily-sales";
import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { buttonVariants, inputClass } from "@/lib/design-system";
import { formatDate, formatDateTime, formatMarketDuration } from "@/lib/date-format";
import { formatMoneyAmount, formatWon } from "@/lib/money";
import { cn } from "@/lib/utils";

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
    <div className="grid gap-[18px] p-0">
      <dl className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
        className="grid gap-3 rounded-[16px] border border-[#e6e2d4] bg-white p-3.5 shadow-[0_1px_3px_rgba(26,27,18,0.05)] md:grid-cols-[minmax(0,1fr)_auto_auto]"
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
          <div className="min-w-0 max-w-full overflow-x-auto rounded-[18px] border border-[#e6e2d4] bg-white shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
            <table className="w-full min-w-[1240px] border-collapse text-sm">
              <thead className="bg-[#16170f] text-left font-mono text-[10px] uppercase tracking-[0.06em] text-[#9b9a86]">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">참가 부스</th>
                  <th className="px-6 py-3.5 text-right font-semibold">현금</th>
                  <th className="px-6 py-3.5 text-right font-semibold">카드</th>
                  <th className="px-6 py-3.5 text-right font-semibold">
                    계좌이체
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold">기타</th>
                  <th className="px-6 py-3.5 text-right font-semibold">
                    총매출
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold">
                    판매 수수료
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold">
                    카드 수수료
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold text-[#c7f94b]">
                    지급 예정
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eee2]">
                {preview.participants.map((participant) => (
                  <SettlementPreviewRow
                    key={participant.participantId}
                    onSelectParticipant={onOpenParticipantDetail}
                    participant={participant}
                  />
                ))}
              </tbody>
            </table>
          </div>
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

function SettlementHistoryPanel({
  history,
  isLoading,
  onOpenSettlementDetail,
}: {
  history: SettlementListItem[];
  isLoading: boolean;
  onOpenSettlementDetail: (settlementId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
        확정 이력을 불러오는 중입니다.
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
        확정된 정산이 없습니다.
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-200">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">정산 회차</h3>
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">회차</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">확정 시각</th>
              <th className="px-4 py-3 text-right font-medium">총매출</th>
              <th className="px-4 py-3 text-right font-medium">지급 예정</th>
              <th className="px-4 py-3 text-right font-medium">마켓 손익</th>
              <th className="px-4 py-3 font-medium">메모</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {history.map((settlement) => (
              <tr data-testid="settlement-history-row" key={settlement.id}>
                <td className="px-4 py-3 font-medium text-zinc-950">
                  v{settlement.versionNo}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {settlementStatusLabels[settlement.status]}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {formatDateTime(settlement.confirmedAt)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-zinc-950">
                  {formatWon(settlement.netSalesAmount)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-700">
                  {formatWon(settlement.participantPayoutAmount)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-700">
                  {formatWon(settlement.marketProfitAmount)}
                </td>
                <td className="max-w-[280px] truncate px-4 py-3 text-zinc-600">
                  {settlement.memo ?? "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className={buttonVariants({
                      intent: "secondary",
                      size: "sm",
                    })}
                    onClick={() => onOpenSettlementDetail(settlement.id)}
                    type="button"
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettlementMetric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "dark" | "default" | "green";
  value: string;
}) {
  const toneClass = {
    amber: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#a9791f]",
    },
    blue: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#2d6fe0]",
    },
    dark: {
      card: "border-[#16170f] bg-[#16170f]",
      label: "text-[#9b9a86]",
      value: "text-white",
    },
    default: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#1a1b12]",
    },
    green: {
      card: "border-[#bfe3cd] bg-[#e6f4ec]",
      label: "text-[#1f8a4d]",
      value: "text-[#1f8a4d]",
    },
  }[tone];

  return (
    <div className={cn("rounded-[16px] border p-[18px]", toneClass.card)}>
      <dt
        className={cn(
          "font-mono text-[10.5px] tracking-[0.05em]",
          toneClass.label,
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 font-display text-[23px] font-bold",
          toneClass.value,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ParticipantSettlementDualChart({
  participants,
}: {
  participants: ParticipantSettlementPreview[];
}) {
  const hasSales = participants.some(
    (participant) =>
      participant.netSalesAmount > 0 || participant.saleLineCount > 0,
  );

  if (!hasSales) {
    return (
      <section className="rounded-[18px] border border-[#e6e2d4] bg-white px-6 py-12 text-center text-sm text-[#8a8775] shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
        상점별 판매 데이터가 없습니다.
      </section>
    );
  }

  const chartWidth = Math.max(980, participants.length * 124 + 184);
  const chartHeight = 360;
  const chartTop = 48;
  const chartBottom = 98;
  const chartLeft = 92;
  const chartRight = 92;
  const plotWidth = chartWidth - chartLeft - chartRight;
  const plotHeight = chartHeight - chartTop - chartBottom;
  const baselineY = chartTop + plotHeight;
  const maxAmount = Math.max(
    1,
    ...participants.map((participant) => participant.netSalesAmount),
  );
  const maxSaleCount = Math.max(
    1,
    ...participants.map((participant) => participant.saleLineCount),
  );
  const xStep = plotWidth / participants.length;
  const barWidth = Math.min(48, xStep * 0.46);
  const points = participants
    .map((participant, index) => {
      const x = chartLeft + xStep * index + xStep / 2;
      const y =
        baselineY - (participant.saleLineCount / maxSaleCount) * plotHeight;

      return `${x},${y}`;
    })
    .join(" ");
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <section className="rounded-[18px] border border-[#e6e2d4] bg-white p-6 shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1b12]">
            상점별 판매 현황
          </h3>
          <p className="mt-1 text-xs text-[#8a8775]">
            플리마켓 기간 내 판매 금액과 판매 건수를 함께 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-medium text-[#56564a]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" />
            판매 금액
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[#18181b]" />
            판매 건수
          </span>
        </div>
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto pt-5">
        <svg
          aria-label="상점별 판매 금액과 판매 건수 그래프"
          className="block"
          height={chartHeight}
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          width={chartWidth}
        >
          <line
            stroke="#d8d3c2"
            strokeWidth="1"
            x1={chartLeft}
            x2={chartWidth - chartRight}
            y1={baselineY}
            y2={baselineY}
          />
          {yTicks.map((tick) => {
            const y = baselineY - tick * plotHeight;
            const amountValue = Math.round(maxAmount * tick);
            const saleCountValue = Math.round(maxSaleCount * tick);

            return (
              <g key={tick}>
                <line
                  stroke="#f1eee2"
                  strokeWidth="1"
                  x1={chartLeft}
                  x2={chartWidth - chartRight}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#8a8775"
                  fontSize="11"
                  textAnchor="end"
                  x={chartLeft - 10}
                  y={y + 4}
                >
                  {formatCompactWon(amountValue)}
                </text>
                <text
                  fill="#8a8775"
                  fontSize="11"
                  textAnchor="start"
                  x={chartWidth - chartRight + 10}
                  y={y + 4}
                >
                  {saleCountValue}건
                </text>
              </g>
            );
          })}
          <text
            fill="#56564a"
            fontSize="12"
            fontWeight="600"
            textAnchor="start"
            x={chartLeft}
            y="16"
          >
            금액
          </text>
          <text
            fill="#56564a"
            fontSize="12"
            fontWeight="600"
            textAnchor="end"
            x={chartWidth - chartRight}
            y="16"
          >
            건수
          </text>
          {participants.map((participant, index) => {
            const x = chartLeft + xStep * index + xStep / 2;
            const barHeight =
              (participant.netSalesAmount / maxAmount) * plotHeight;
            const y = baselineY - barHeight;

            return (
              <g key={participant.participantId}>
                <title>
                  {participant.displayName}:{" "}
                  {formatWon(participant.netSalesAmount)},{" "}
                  {participant.saleLineCount}건
                </title>
                <rect
                  fill="#10b981"
                  height={barHeight}
                  rx="4"
                  width={barWidth}
                  x={x - barWidth / 2}
                  y={y}
                />
                <text
                  fill="#56564a"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  x={x}
                  y={baselineY + 24}
                >
                  {truncateChartLabel(participant.displayName)}
                </text>
                <text
                  fill="#8a8775"
                  fontSize="10"
                  textAnchor="middle"
                  x={x}
                  y={baselineY + 42}
                >
                  {formatCompactWon(participant.netSalesAmount)}
                </text>
              </g>
            );
          })}
          <polyline
            fill="none"
            points={points}
            stroke="#18181b"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
          {participants.map((participant, index) => {
            const x = chartLeft + xStep * index + xStep / 2;
            const y =
              baselineY - (participant.saleLineCount / maxSaleCount) * plotHeight;

            return (
              <g key={`${participant.participantId}-count`}>
                <circle
                  cx={x}
                  cy={y}
                  fill="#ffffff"
                  r="5"
                  stroke="#18181b"
                  strokeWidth="2"
                />
                <text
                  fill="#18181b"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  x={x}
                  y={Math.max(12, y - 10)}
                >
                  {participant.saleLineCount}건
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function ParticipantDailySalesDetail({
  isReceiptsLoading,
  market,
  participant,
  receipts,
  onBackToList,
}: {
  isReceiptsLoading: boolean;
  market: Market | null;
  participant: ParticipantSettlementPreview | null;
  receipts: Receipt[];
  onBackToList: () => void;
}) {
  if (!participant) {
    return (
      <section className="rounded-[18px] border border-[#e6e2d4] bg-white px-6 py-12 text-center text-sm text-[#8a8775] shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
        선택한 참가부스 정산 데이터를 찾을 수 없습니다.
      </section>
    );
  }

  if (isReceiptsLoading) {
    return (
      <section className="rounded-[18px] border border-[#e6e2d4] bg-white px-6 py-12 text-center text-sm text-[#8a8775] shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
        날짜별 판매 데이터를 불러오는 중입니다.
      </section>
    );
  }

  const dailySales = buildParticipantDailySales(
    participant.participantId,
    receipts,
    market?.startsOn ?? null,
    market?.endsOn ?? null,
  );

  return (
    <section className="rounded-[18px] border border-[#e6e2d4] bg-white p-6 shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1b12]">
            {participant.displayName} 날짜별 판매
          </h3>
          <p className="mt-1 text-xs text-[#8a8775]">
            {participantTypeLabels[participant.participantType]} ·{" "}
            {formatMarketDuration(market?.startsOn ?? null, market?.endsOn ?? null)}
          </p>
        </div>
        <div className="grid gap-2 lg:justify-items-end">
          <button
            className={buttonVariants({ intent: "secondary", size: "sm" })}
            onClick={onBackToList}
            type="button"
          >
            <ArrowLeft aria-hidden className="mr-1.5 h-3.5 w-3.5" />
            목록
          </button>
          <dl className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[10px] border border-[#e6e2d4] bg-[#fcfbf6] px-3 py-2">
              <dt className="text-xs font-medium text-[#8a8775]">총매출</dt>
              <dd className="mt-1 text-sm font-semibold text-[#1a1b12]">
                {formatWon(participant.netSalesAmount)}
              </dd>
            </div>
            <div className="rounded-[10px] border border-[#e6e2d4] bg-[#fcfbf6] px-3 py-2">
              <dt className="text-xs font-medium text-[#8a8775]">판매 건수</dt>
              <dd className="mt-1 text-sm font-semibold text-[#1a1b12]">
                {participant.saleLineCount}건
              </dd>
            </div>
            <div className="rounded-[10px] border border-[#e6e2d4] bg-[#fcfbf6] px-3 py-2">
              <dt className="text-xs font-medium text-[#8a8775]">평균 판매</dt>
              <dd className="mt-1 text-sm font-semibold text-[#1a1b12]">
                {formatWon(
                  participant.saleLineCount > 0
                    ? Math.round(
                        participant.netSalesAmount / participant.saleLineCount,
                      )
                    : 0,
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <ParticipantDailySalesChart points={dailySales} />
    </section>
  );
}

function ParticipantDailySalesChart({
  points,
}: {
  points: ParticipantDailySalesPoint[];
}) {
  const hasSales = points.some((point) => point.amount > 0 || point.saleCount > 0);

  if (!hasSales) {
    return (
      <div className="py-10 text-center text-sm text-[#8a8775]">
        날짜별 판매 데이터가 없습니다.
      </div>
    );
  }

  const chartWidth = Math.max(820, points.length * 112 + 184);
  const chartHeight = 340;
  const chartTop = 48;
  const chartBottom = 92;
  const chartLeft = 92;
  const chartRight = 92;
  const plotWidth = chartWidth - chartLeft - chartRight;
  const plotHeight = chartHeight - chartTop - chartBottom;
  const baselineY = chartTop + plotHeight;
  const maxAmount = Math.max(1, ...points.map((point) => point.amount));
  const maxSaleCount = Math.max(1, ...points.map((point) => point.saleCount));
  const xStep = plotWidth / points.length;
  const barWidth = Math.min(42, xStep * 0.44);
  const linePoints = points
    .map((point, index) => {
      const x = chartLeft + xStep * index + xStep / 2;
      const y = baselineY - (point.saleCount / maxSaleCount) * plotHeight;

      return `${x},${y}`;
    })
    .join(" ");
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="min-w-0 max-w-full overflow-x-auto pt-5">
      <svg
        aria-label="날짜별 판매 금액과 판매 건수 그래프"
        className="block"
        height={chartHeight}
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width={chartWidth}
      >
        <line
          stroke="#d8d3c2"
          strokeWidth="1"
          x1={chartLeft}
          x2={chartWidth - chartRight}
          y1={baselineY}
          y2={baselineY}
        />
        {yTicks.map((tick) => {
          const y = baselineY - tick * plotHeight;
          const amountValue = Math.round(maxAmount * tick);
          const saleCountValue = Math.round(maxSaleCount * tick);

          return (
            <g key={tick}>
              <line
                stroke="#f1eee2"
                strokeWidth="1"
                x1={chartLeft}
                x2={chartWidth - chartRight}
                y1={y}
                y2={y}
              />
              <text
                fill="#8a8775"
                fontSize="11"
                textAnchor="end"
                x={chartLeft - 10}
                y={y + 4}
              >
                {formatCompactWon(amountValue)}
              </text>
              <text
                fill="#8a8775"
                fontSize="11"
                textAnchor="start"
                x={chartWidth - chartRight + 10}
                y={y + 4}
              >
                {saleCountValue}건
              </text>
            </g>
          );
        })}
        <text
          fill="#56564a"
          fontSize="12"
          fontWeight="600"
          textAnchor="start"
          x={chartLeft}
          y="16"
        >
          금액
        </text>
        <text
          fill="#56564a"
          fontSize="12"
          fontWeight="600"
          textAnchor="end"
          x={chartWidth - chartRight}
          y="16"
        >
          건수
        </text>
        {points.map((point, index) => {
          const x = chartLeft + xStep * index + xStep / 2;
          const barHeight = (point.amount / maxAmount) * plotHeight;
          const y = baselineY - barHeight;

          return (
            <g key={point.date}>
              <title>
                {formatDate(point.date)}: {formatWon(point.amount)},{" "}
                {point.saleCount}건
              </title>
              <rect
                fill="#10b981"
                height={barHeight}
                rx="4"
                width={barWidth}
                x={x - barWidth / 2}
                y={y}
              />
              <text
                fill="#56564a"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                x={x}
                y={baselineY + 24}
              >
                {formatChartDateLabel(point.date)}
              </text>
              <text
                fill="#8a8775"
                fontSize="10"
                textAnchor="middle"
                x={x}
                y={baselineY + 42}
              >
                {formatCompactWon(point.amount)}
              </text>
            </g>
          );
        })}
        <polyline
          fill="none"
          points={linePoints}
          stroke="#18181b"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        {points.map((point, index) => {
          const x = chartLeft + xStep * index + xStep / 2;
          const y = baselineY - (point.saleCount / maxSaleCount) * plotHeight;

          return (
            <g key={`${point.date}-count`}>
              <circle
                cx={x}
                cy={y}
                fill="#ffffff"
                r="5"
                stroke="#18181b"
                strokeWidth="2"
              />
              <text
                fill="#18181b"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                x={x}
                y={Math.max(12, y - 10)}
              >
                {point.saleCount}건
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SettlementPreviewRow({
  onSelectParticipant,
  participant,
}: {
  onSelectParticipant: (participantId: string) => void;
  participant: ParticipantSettlementPreview;
}) {
  return (
    <tr
      className="cursor-pointer transition hover:bg-[#fcfdf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c7f94b]"
      data-testid="settlement-row"
      onClick={() => onSelectParticipant(participant.participantId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectParticipant(participant.participantId);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <td className="px-6 py-4">
        <p className="text-[14.5px] font-semibold text-[#1a1b12]">
          {participant.displayName}
        </p>
        <p className="mt-1 flex items-center gap-1.5">
          <ParticipantTypeBadge type={participant.participantType} />
          <span className="font-mono text-[10.5px] text-[#a8a593]">
            {participant.saleLineCount}건
          </span>
        </p>
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.cashSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.cardSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.transferSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.otherSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[14.5px] font-bold text-[#1a1b12]">
        {formatWon(participant.netSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] font-semibold text-[#1a1b12]">
        {formatWon(participant.salesCommissionAmount)}
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {formatPercent(participant.salesCommissionRate)}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] font-semibold text-[#2d6fe0]">
        {formatWon(participant.cardFeeAmount)}
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {formatPercent(participant.cardFeeRate)}
        </span>
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {participant.cardFeePayer === "participant" ? "참가부스" : "마켓"}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-display text-[15px] font-bold text-[#1f8a4d]">
        {formatWon(participant.payoutAmount)}
      </td>
    </tr>
  );
}

function formatChartDateLabel(value: string): string {
  const [, month, day] = value.split("-");

  return month && day ? `${Number(month)}/${Number(day)}` : value;
}

function formatCompactWon(value: number): string {
  if (value >= 100_000_000) {
    return `${formatCompactNumber(value / 100_000_000)}억`;
  }

  if (value >= 10_000) {
    return `${formatCompactNumber(value / 10_000)}만`;
  }

  return `${formatMoneyAmount(value)}원`;
}

function formatCompactNumber(value: number): string {
  return value >= 10
    ? String(Math.round(value))
    : value.toFixed(1).replace(/\.0$/, "");
}

function truncateChartLabel(value: string): string {
  return value.length > 7 ? `${value.slice(0, 7)}...` : value;
}
