import type { ParticipantSettlementPreview } from "@/services/settlements.service";
import {
  formatCompactWon,
  truncateChartLabel,
} from "@/features/settlements/lib/settlement-chart-format";
import { formatWon } from "@/lib/money";

export function ParticipantSettlementDualChart({
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
      <section className="min-w-0 rounded-[18px] border border-[#e6e2d4] bg-white px-4 py-10 text-center text-sm text-[#8a8775] shadow-[0_1px_3px_rgba(26,27,18,0.05)] sm:px-6 sm:py-12">
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
    <section className="min-w-0 rounded-[18px] border border-[#e6e2d4] bg-white p-4 shadow-[0_1px_3px_rgba(26,27,18,0.05)] sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
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
