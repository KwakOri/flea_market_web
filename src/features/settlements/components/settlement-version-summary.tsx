import type { Settlement } from "@/services/settlements.service";
import { formatFullDateTime } from "@/lib/date-format";
import { formatWon } from "@/lib/money";
import {
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function SettlementSummary({ settlement }: { settlement: Settlement }) {
  return (
    <section className={panelVariants()}>
      <div
        className={cn(
          sectionHeaderClass,
          "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div>
          <h2 className={sectionTitleClass}>정산 개요</h2>
          <p className={sectionDescriptionClass}>
            확정 시각 {formatFullDateTime(settlement.confirmedAt)}
          </p>
        </div>
        <div className="text-left text-xs text-zinc-500 sm:text-right">
          <p>기준 회차</p>
          <p className="mt-1 font-mono text-zinc-700">
            {settlement.baseSettlementId
              ? shortId(settlement.baseSettlementId)
              : "-"}
          </p>
        </div>
      </div>
      <dl className="grid gap-px border-b border-zinc-200 bg-zinc-200 sm:grid-cols-2 xl:grid-cols-3">
        <SettlementMetric
          label="총매출"
          value={formatWon(settlement.netSalesAmount)}
        />
        <SettlementMetric
          label="지급 예정"
          value={formatWon(settlement.participantPayoutAmount)}
        />
        <SettlementMetric
          label="마켓 손익"
          value={formatWon(settlement.marketProfitAmount)}
        />
        <SettlementMetric
          label="판매 수수료"
          value={formatWon(settlement.salesCommissionAmount)}
        />
        <SettlementMetric
          label="참가부스 부담 카드 수수료"
          value={formatWon(settlement.cardFeeChargedToParticipantAmount)}
        />
        <SettlementMetric
          label="마켓 부담 카드 수수료"
          value={formatWon(settlement.cardFeePaidByMarketAmount)}
        />
      </dl>
      <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem label="참가부스" value={`${settlement.participantCount}개`} />
        <MetaItem label="영수증" value={`${settlement.receiptCount}건`} />
        <MetaItem label="판매 건수" value={`${settlement.saleLineCount}건`} />
        <MetaItem label="메모" value={settlement.memo ?? "-"} />
      </dl>
    </section>
  );
}

function SettlementMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function shortId(value: string): string {
  return value.slice(0, 8);
}
