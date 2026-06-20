import type { MarketStatus } from "@/services/markets.service";

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
      return "bg-emerald-100 text-emerald-800";
    case "closed":
      return "bg-zinc-100 text-zinc-700";
    case "archived":
      return "bg-slate-100 text-slate-700";
    case "draft":
    default:
      return "bg-amber-100 text-amber-800";
  }
}
