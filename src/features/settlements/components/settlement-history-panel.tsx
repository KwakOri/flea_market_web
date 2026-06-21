import type { SettlementListItem } from "@/services/settlements.service";
import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { buttonVariants } from "@/lib/design-system";
import { formatDateTime } from "@/lib/date-format";
import { formatWon } from "@/lib/money";

export function SettlementHistoryPanel({
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
      <div className="grid gap-3 px-4 pb-4 md:hidden">
        {history.map((settlement) => (
          <SettlementHistoryCard
            key={settlement.id}
            settlement={settlement}
            onOpenSettlementDetail={onOpenSettlementDetail}
          />
        ))}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-sm xl:min-w-[1000px]">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-3 font-medium xl:px-4">회차</th>
              <th className="px-3 py-3 font-medium xl:px-4">상태</th>
              <th className="px-3 py-3 font-medium xl:px-4">확정 시각</th>
              <th className="px-3 py-3 text-right font-medium xl:px-4">총매출</th>
              <th className="px-3 py-3 text-right font-medium xl:px-4">지급 예정</th>
              <th className="px-3 py-3 text-right font-medium xl:px-4">마켓 손익</th>
              <th className="px-3 py-3 font-medium xl:px-4">메모</th>
              <th className="px-3 py-3 text-right font-medium xl:px-4">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {history.map((settlement) => (
              <tr data-testid="settlement-history-row" key={settlement.id}>
                <td className="px-3 py-3 font-medium text-zinc-950 xl:px-4">
                  v{settlement.versionNo}
                </td>
                <td className="px-3 py-3 text-zinc-700 xl:px-4">
                  {settlementStatusLabels[settlement.status]}
                </td>
                <td className="px-3 py-3 text-zinc-700 xl:px-4">
                  {formatDateTime(settlement.confirmedAt)}
                </td>
                <td className="px-3 py-3 text-right font-medium text-zinc-950 xl:px-4">
                  {formatWon(settlement.netSalesAmount)}
                </td>
                <td className="px-3 py-3 text-right text-zinc-700 xl:px-4">
                  {formatWon(settlement.participantPayoutAmount)}
                </td>
                <td className="px-3 py-3 text-right text-zinc-700 xl:px-4">
                  {formatWon(settlement.marketProfitAmount)}
                </td>
                <td className="max-w-[220px] truncate px-3 py-3 text-zinc-600 xl:max-w-[280px] xl:px-4">
                  {settlement.memo ?? "-"}
                </td>
                <td className="px-3 py-3 text-right xl:px-4">
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

function SettlementHistoryCard({
  onOpenSettlementDetail,
  settlement,
}: {
  onOpenSettlementDetail: (settlementId: string) => void;
  settlement: SettlementListItem;
}) {
  return (
    <article
      className="grid gap-3 rounded-[14px] border border-[#e6e2d4] bg-white p-4"
      data-testid="settlement-history-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-[#1a1b12]">
            v{settlement.versionNo}
          </p>
          <p className="mt-1 text-sm text-[#56564a]">
            {settlementStatusLabels[settlement.status]} ·{" "}
            {formatDateTime(settlement.confirmedAt)}
          </p>
        </div>
        <button
          className={buttonVariants({ intent: "secondary", size: "sm" })}
          onClick={() => onOpenSettlementDetail(settlement.id)}
          type="button"
        >
          상세
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <SettlementHistoryMetric
          label="총매출"
          value={formatWon(settlement.netSalesAmount)}
        />
        <SettlementHistoryMetric
          label="지급 예정"
          value={formatWon(settlement.participantPayoutAmount)}
        />
        <SettlementHistoryMetric
          label="마켓 손익"
          value={formatWon(settlement.marketProfitAmount)}
        />
        <SettlementHistoryMetric label="메모" value={settlement.memo ?? "-"} />
      </dl>
    </article>
  );
}

function SettlementHistoryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[10px] bg-[#fcfbf6] px-3 py-2">
      <dt className="font-mono text-[10px] text-[#8a8775]">{label}</dt>
      <dd className="mt-0.5 truncate font-display font-semibold text-[#1a1b12]">
        {value}
      </dd>
    </div>
  );
}
