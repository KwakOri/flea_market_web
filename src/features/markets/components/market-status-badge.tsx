import {
  Archive,
  CircleCheck,
  CircleDot,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { MarketStatus } from "@/services/markets.service";
import {
  getMarketStatusBadgeClass,
  marketStatusLabels,
} from "@/features/markets/lib/market-display";
import { cn } from "@/lib/utils";

// DESIGN 접근성: 상태는 색 + 라벨 + 아이콘 병행
const marketStatusIcons: Record<MarketStatus, LucideIcon> = {
  active: CircleDot,
  draft: Clock,
  closed: CircleCheck,
  archived: Archive,
};

export function MarketStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: MarketStatus;
}) {
  const Icon = marketStatusIcons[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
        getMarketStatusBadgeClass(status),
        className,
      )}
    >
      <Icon aria-hidden className="h-3 w-3 flex-none" strokeWidth={2.4} />
      {marketStatusLabels[status]}
    </span>
  );
}
