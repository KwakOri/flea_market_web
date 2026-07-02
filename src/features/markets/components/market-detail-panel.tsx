import type { Market } from "@/services/markets.service";
import { MarketStatusBadge } from "@/features/markets/components/market-status-badge";
import {
  formatDate,
  formatDateRange,
  formatMarketDuration,
} from "@/lib/date-format";

export function MarketDetailPanel({
  market,
}: {
  market: Market | null;
}) {
  if (!market) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        마켓 정보를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div className="p-4">
      <dl className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
        <div className="rounded-md border border-hairline bg-canvas-soft p-3">
          <dt className="text-xs font-medium text-muted">마켓명</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {market.name}
          </dd>
        </div>
        <div className="rounded-md border border-hairline bg-canvas-soft p-3">
          <dt className="text-xs font-medium text-muted">상태</dt>
          <dd className="mt-1">
            <MarketStatusBadge status={market.status} />
          </dd>
        </div>
        <div className="rounded-md border border-hairline bg-canvas-soft p-3">
          <dt className="text-xs font-medium text-muted">기간</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {formatDateRange(market.startsOn, market.endsOn)}
          </dd>
        </div>
        <div className="rounded-md border border-hairline bg-canvas-soft p-3">
          <dt className="text-xs font-medium text-muted">진행일</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {formatMarketDuration(market.startsOn, market.endsOn)}
          </dd>
        </div>
        <div className="rounded-md border border-hairline bg-canvas-soft p-3">
          <dt className="text-xs font-medium text-muted">등록일</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {formatDate(market.createdAt)}
          </dd>
        </div>
        <div className="rounded-md border border-hairline bg-canvas-soft p-3 sm:col-span-2 2xl:col-span-5">
          <dt className="text-xs font-medium text-muted">메모</dt>
          <dd className="mt-1 text-sm font-medium text-ink">
            {market.description || "-"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
