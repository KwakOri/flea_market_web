import type { Settlement } from "@/services/settlements.service";
import { formatFullDateTime } from "@/lib/date-format";
import { formatWon } from "@/lib/money";
import { cn } from "@/lib/utils";

type SummaryMetric = {
  label: string;
  tone?: "dark" | "green" | "blue" | "gold" | "default";
  value: string;
};

export function SettlementSummary({ settlement }: { settlement: Settlement }) {
  const metrics: SummaryMetric[] = [
    {
      label: "총매출",
      tone: "dark",
      value: formatWon(settlement.netSalesAmount),
    },
    {
      label: "지급 예정",
      tone: "green",
      value: formatWon(settlement.participantPayoutAmount),
    },
    {
      label: "마켓 손익",
      value: formatWon(settlement.marketProfitAmount),
    },
    {
      label: "판매 수수료",
      value: formatWon(settlement.salesCommissionAmount),
    },
    {
      label: "참가부스 부담 카드 수수료",
      tone: "blue",
      value: formatWon(settlement.cardFeeChargedToParticipantAmount),
    },
    {
      label: "마켓 부담 카드 수수료",
      tone: "gold",
      value: formatWon(settlement.cardFeePaidByMarketAmount),
    },
  ];

  return (
    <section className="overflow-hidden rounded-[12px] border border-hairline bg-surface shadow-card">
      <div className="flex flex-col gap-[18px] border-b border-hairline px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <h2 className="dsp m-0 text-[17px] font-bold text-ink">
            정산 개요
          </h2>
          <p className="mono mt-[5px] text-[11px] tracking-[0.02em] text-muted">
            확정 시각 {formatFullDateTime(settlement.confirmedAt)}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="mono text-[10px] tracking-[0.06em] text-muted">
            기준 회차
          </p>
          <p className="num mt-[3px] text-[15px] font-semibold text-muted-soft">
            {settlement.baseSettlementId
              ? shortId(settlement.baseSettlementId)
              : "—"}
          </p>
        </div>
      </div>

      <dl className="grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <SettlementMetric key={metric.label} metric={metric} />
        ))}
      </dl>

      <dl className="grid gap-5 border-t border-hairline bg-surface px-5 py-[18px] sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <MetaItem label="참가부스" value={`${settlement.participantCount}개`} />
        <MetaItem label="영수증" value={`${settlement.receiptCount}건`} />
        <MetaItem label="판매 건수" value={`${settlement.saleLineCount}건`} />
        <MetaItem label="메모" value={settlement.memo?.trim() || "—"} />
      </dl>
    </section>
  );
}

function SettlementMetric({ metric }: { metric: SummaryMetric }) {
  const isDark = metric.tone === "dark";

  return (
    <div
      className={cn(
        "px-5 py-[18px] sm:px-6",
        isDark ? "bg-brand-deep" : metric.tone === "green" ? "bg-[#e6f4ec]" : "bg-surface",
      )}
    >
      <dt
        className={cn(
          "mono text-[10.5px] tracking-[0.05em]",
          getMetricLabelClass(metric.tone),
        )}
      >
        {metric.label}
      </dt>
      <dd
        className={cn(
          "num mt-[7px] text-[23px] font-bold leading-tight",
          getMetricValueClass(metric.tone),
        )}
      >
        {metric.value}
      </dd>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="mono text-[10.5px] tracking-[0.05em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[15px] font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}

function getMetricLabelClass(tone: SummaryMetric["tone"]): string {
  switch (tone) {
    case "dark":
      return "text-muted-soft";
    case "green":
      return "text-[#1f8a4d]";
    default:
      return "text-muted";
  }
}

function getMetricValueClass(tone: SummaryMetric["tone"]): string {
  switch (tone) {
    case "dark":
      return "text-on-brand-deep";
    case "green":
      return "text-[#1f8a4d]";
    case "blue":
      return "text-[#2d6fe0]";
    case "gold":
      return "text-warning";
    default:
      return "text-amount-default";
  }
}

function shortId(value: string): string {
  return value.slice(0, 8);
}
