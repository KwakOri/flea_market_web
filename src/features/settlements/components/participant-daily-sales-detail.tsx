import { ArrowLeft } from "lucide-react";
import type { Market } from "@/services/markets.service";
import type { Receipt } from "@/services/receipts.service";
import type { ParticipantSettlementPreview } from "@/services/settlements.service";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
import {
  buildParticipantDailySales,
  type ParticipantDailySalesPoint,
} from "@/features/settlements/lib/settlement-daily-sales";
import {
  formatChartDateLabel,
  formatCompactWon,
} from "@/features/settlements/lib/settlement-chart-format";
import { buttonVariants } from "@/lib/design-system";
import { formatDate, formatMarketDuration } from "@/lib/date-format";
import { formatWon } from "@/lib/money";

export function ParticipantDailySalesDetail({
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
      <section className="min-w-0 rounded-[12px] border border-hairline bg-surface px-4 py-10 text-center text-sm text-muted shadow-card sm:px-6 sm:py-12">
        선택한 참가부스 정산 데이터를 찾을 수 없습니다.
      </section>
    );
  }

  if (isReceiptsLoading) {
    return (
      <section className="min-w-0 rounded-[12px] border border-hairline bg-surface px-4 py-10 text-center text-sm text-muted shadow-card sm:px-6 sm:py-12">
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
    <section className="min-w-0 rounded-[12px] border border-hairline bg-surface p-4 shadow-card sm:p-6">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">
            {participant.displayName} 날짜별 판매
          </h3>
          <p className="mt-1 text-xs text-muted">
            {participantTypeLabels[participant.participantType]} ·{" "}
            {formatMarketDuration(market?.startsOn ?? null, market?.endsOn ?? null)}
          </p>
        </div>
        <div className="grid min-w-0 gap-2 lg:justify-items-end">
          <button
            className={buttonVariants({ intent: "secondary", size: "sm" })}
            onClick={onBackToList}
            type="button"
          >
            <ArrowLeft aria-hidden className="mr-1.5 h-3.5 w-3.5" />
            목록
          </button>
          <dl className="grid min-w-0 gap-2 sm:grid-cols-3">
            <div className="min-w-0 rounded-[8px] border border-hairline bg-canvas-soft px-3 py-2">
              <dt className="text-xs font-medium text-muted">총매출</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-amount-default">
                {formatWon(participant.netSalesAmount)}
              </dd>
            </div>
            <div className="min-w-0 rounded-[8px] border border-hairline bg-canvas-soft px-3 py-2">
              <dt className="text-xs font-medium text-muted">판매 건수</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-amount-default">
                {participant.saleLineCount}건
              </dd>
            </div>
            <div className="min-w-0 rounded-[8px] border border-hairline bg-canvas-soft px-3 py-2">
              <dt className="text-xs font-medium text-muted">평균 판매</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-amount-default">
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
      <div className="py-10 text-center text-sm text-muted">
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
          stroke="#d5d0bf"
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
                stroke="#e7e2d4"
                strokeWidth="1"
                x1={chartLeft}
                x2={chartWidth - chartRight}
                y1={y}
                y2={y}
              />
              <text
                fill="#686d5c"
                fontSize="11"
                textAnchor="end"
                x={chartLeft - 10}
                y={y + 4}
              >
                {formatCompactWon(amountValue)}
              </text>
              <text
                fill="#686d5c"
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
          fill="#494f3e"
          fontSize="12"
          fontWeight="600"
          textAnchor="start"
          x={chartLeft}
          y="16"
        >
          금액
        </text>
        <text
          fill="#494f3e"
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
                fill="#494f3e"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                x={x}
                y={baselineY + 24}
              >
                {formatChartDateLabel(point.date)}
              </text>
              <text
                fill="#686d5c"
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
          stroke="#2a2e22"
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
                stroke="#2a2e22"
                strokeWidth="2"
              />
              <text
                fill="#2a2e22"
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
