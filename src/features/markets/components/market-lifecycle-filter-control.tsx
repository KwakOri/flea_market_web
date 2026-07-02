import {
  marketLifecycleFilters,
  type MarketLifecycleFilter,
} from "@/features/markets/lib/market-display";
import { FLEA_MARKET } from "@/lib/terminology";
import { cn } from "@/lib/utils";

export function MarketLifecycleFilterControl({
  onSelectFilter,
  selectedFilter,
}: {
  onSelectFilter: (filter: MarketLifecycleFilter) => void;
  selectedFilter: MarketLifecycleFilter;
}) {
  return (
    <div
      aria-label={`${FLEA_MARKET} 상태 필터`}
      className="inline-flex w-fit rounded-lg border border-hairline bg-surface-sunken p-1"
      role="group"
    >
      {marketLifecycleFilters.map((filter) => {
        const isActive = selectedFilter === filter.value;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "h-9 rounded-md px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              isActive
                ? "bg-surface-raised text-ink shadow-sm ring-1 ring-hairline"
                : "text-muted hover:bg-surface-raised/70 hover:text-ink",
            )}
            key={filter.value}
            onClick={() => onSelectFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
