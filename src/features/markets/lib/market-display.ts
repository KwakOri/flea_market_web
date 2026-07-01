import type { Market, MarketStatus } from "@/services/markets.service";

export type MarketLifecycleFilter = "all" | "upcoming" | "active" | "ended";

export const marketStatusLabels: Record<MarketStatus, string> = {
  draft: "예정",
  active: "진행중",
  closed: "종료",
  archived: "보관",
};

export const marketLifecycleFilters: Array<{
  label: string;
  value: MarketLifecycleFilter;
}> = [
  { label: "전체", value: "all" },
  { label: "예정", value: "upcoming" },
  { label: "진행중", value: "active" },
  { label: "종료", value: "ended" },
];

export function getMarketStatusBadgeClass(status: MarketStatus): string {
  switch (status) {
    case "active":
      return "bg-success-tint text-success";
    case "closed":
      return "bg-canvas-soft text-muted";
    case "archived":
      return "bg-canvas-soft text-muted";
    case "draft":
    default:
      return "bg-info-tint text-info";
  }
}

export function filterMarketsByLifecycle(
  markets: Market[],
  filter: MarketLifecycleFilter,
): Market[] {
  if (filter === "all") {
    return markets;
  }

  return markets.filter((market) => getMarketLifecycle(market.status) === filter);
}

export function sortMarketsByNewest(markets: Market[]): Market[] {
  return [...markets].sort(
    (left, right) => getMarketSortTime(right) - getMarketSortTime(left),
  );
}

function getMarketSortTime(market: Market): number {
  const time = Date.parse(market.startsOn ?? market.endsOn ?? market.createdAt);

  return Number.isNaN(time) ? 0 : time;
}

function getMarketLifecycle(
  status: MarketStatus,
): Exclude<MarketLifecycleFilter, "all"> {
  switch (status) {
    case "draft":
      return "upcoming";
    case "active":
      return "active";
    case "closed":
    case "archived":
    default:
      return "ended";
  }
}
