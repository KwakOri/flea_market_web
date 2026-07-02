import { Pencil } from "lucide-react";
import type { Market } from "@/services/markets.service";
import { MarketStatusBadge } from "@/features/markets/components/market-status-badge";
import { buttonVariants } from "@/lib/design-system";
import {
  formatDate,
  formatDateRange,
  formatMarketDuration,
} from "@/lib/date-format";
import { cn } from "@/lib/utils";

export function MarketSelectionCards({
  emptyMessage = "등록된 마켓이 없습니다.",
  markets,
  selectedMarketId,
  onManageMarket,
  onSelectMarket,
}: {
  emptyMessage?: string;
  markets: Market[];
  selectedMarketId: string | null;
  onManageMarket?: (market: Market) => void;
  onSelectMarket: (marketId: string) => void;
}) {
  if (markets.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-hairline border-t border-hairline">
      {markets.map((market) => {
        const isSelected = selectedMarketId === market.id;

        return (
          <article
            className={cn(
              "grid cursor-pointer gap-4 px-4 py-4 transition hover:bg-brand-tint/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_auto] lg:items-center",
              isSelected && "bg-brand-tint-strong",
            )}
            data-testid="receipt-market-row"
            key={market.id}
            onClick={() => onSelectMarket(market.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectMarket(market.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-brand">
                  플리마켓
                </p>
                <MarketStatusBadge status={market.status} />
              </div>
              <h3 className="mt-2 truncate text-lg font-semibold text-ink">
                {market.name}
              </h3>
              <p className="mt-2 text-sm font-medium text-body">
                {formatDateRange(market.startsOn, market.endsOn)}
              </p>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-[120px_140px_minmax(0,1fr)]">
              <div>
                <dt className="text-xs font-medium text-muted">진행일</dt>
                <dd className="mt-1 font-medium text-ink">
                  {formatMarketDuration(market.startsOn, market.endsOn)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted">등록일</dt>
                <dd className="mt-1 font-medium text-ink">
                  {formatDate(market.createdAt)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-muted">메모</dt>
                <dd className="mt-1 truncate text-body">
                  {market.description || "-"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {onManageMarket && (
                <button
                  className={buttonVariants({ intent: "secondary", size: "sm" })}
                  onClick={(event) => {
                    event.stopPropagation();
                    onManageMarket(market);
                  }}
                  type="button"
                >
                  <Pencil aria-hidden className="mr-1.5 h-3.5 w-3.5" />
                  정보 수정
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
