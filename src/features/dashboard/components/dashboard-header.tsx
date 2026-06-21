"use client";

import { ArrowLeft } from "lucide-react";
import type { AuthUser } from "@/services/auth.service";
import type {
  DashboardSummaryItem,
  DashboardView,
} from "@/features/dashboard/components/dashboard-shell.types";
import { dashboardViewLabels } from "@/features/dashboard/components/dashboard-shell.types";
import { buttonVariants } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  backHref,
  marketDateRange,
  marketName,
  onBack,
  showSummary,
  statusLabel,
  summaryItems,
  user,
  view,
}: {
  backHref: string | null;
  marketDateRange: string | null;
  marketName: string | null;
  onBack: (href: string) => void;
  showSummary: boolean;
  statusLabel: string;
  summaryItems: DashboardSummaryItem[];
  user: AuthUser;
  view: DashboardView;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d8d3c2] bg-[#e9e5d8]/80 py-[18px] pl-[calc(76px+1rem)] pr-4 backdrop-blur-md sm:pl-[calc(76px+1.5rem)] sm:pr-6 lg:pl-[calc(76px+2rem)] lg:pr-8 xl:pl-[calc(76px+2.5rem)] xl:pr-10">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          {backHref && (
            <button
              className={cn(
                buttonVariants({ intent: "secondary", size: "sm" }),
                "gap-1.5",
              )}
              onClick={() => onBack(backHref)}
              type="button"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              뒤로
            </button>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bfe3cd] bg-[#e6f4ec] px-3 py-1.5">
            <span className="h-[7px] w-[7px] rounded-full bg-[#1f8a4d] [animation:okpulse_2.4s_infinite]" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-[#1f8a4d]">
              {statusLabel}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] tracking-[0.08em] text-[#8a8775]">
              {marketName ? "CURRENT MARKET" : "WORKSPACE"}
            </div>
            <h1 className="mt-0.5 truncate font-display text-[22px] font-bold tracking-[-0.02em] text-[#1a1b12]">
              {marketName ?? dashboardViewLabels[view]}
            </h1>
          </div>
          {marketDateRange && (
            <span className="basis-full pb-0.5 font-mono text-[11.5px] text-[#8a8775] sm:basis-auto">
              {marketDateRange}
            </span>
          )}
        </div>

        {showSummary ? (
          <DashboardSummary items={summaryItems} />
        ) : (
          <div className="hidden rounded-[14px] border border-[#d8d3c2] bg-[#fbf9f1] px-[18px] py-2.5 sm:block">
            <div className="font-mono text-[10px] tracking-[0.06em] text-[#8a8775]">
              OPERATOR
            </div>
            <div className="mt-0.5 text-sm font-bold text-[#1a1b12]">
              {user.displayName}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function DashboardSummary({ items }: { items: DashboardSummaryItem[] }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-2 items-stretch overflow-hidden rounded-[14px] border border-[#d8d3c2] bg-[#fbf9f1] sm:grid-cols-4 xl:flex xl:w-auto">
      {items.map((item, index) => (
        <div
          className={cn(
            "min-w-0 border-[#e7e2d2] px-3 py-2.5 sm:px-4 xl:min-w-[112px] xl:px-[18px]",
            index % 2 === 1 && "border-l sm:border-l-0",
            index > 0 && "sm:border-l",
            index > 1 && "border-t sm:border-t-0",
            item.accent && "bg-[#faf0db]",
          )}
          key={item.label}
        >
          <div
            className={cn(
              "font-mono text-[10px] tracking-[0.06em]",
              item.accent ? "text-[#a9791f]" : "text-[#8a8775]",
            )}
          >
            {item.label}
          </div>
          <div
            className={cn(
              "mt-0.5 truncate whitespace-nowrap font-display text-[17px] font-bold sm:text-[18px] xl:text-[19px]",
              item.accent && "text-[#a9791f]",
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
