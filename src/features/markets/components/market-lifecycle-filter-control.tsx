import {
  marketLifecycleFilters,
  type MarketLifecycleFilter,
} from "@/features/markets/lib/market-display";
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
      aria-label="플리마켓 상태 필터"
      className="inline-flex w-fit rounded-lg border border-zinc-200 bg-zinc-100 p-1"
      role="group"
    >
      {marketLifecycleFilters.map((filter) => {
        const isActive = selectedFilter === filter.value;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "h-9 rounded-md px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
              isActive
                ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200"
                : "text-zinc-500 hover:bg-white/70 hover:text-zinc-950",
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
