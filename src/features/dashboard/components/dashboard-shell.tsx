"use client";

import type { ReactNode } from "react";
import type { AuthUser } from "@/services/auth.service";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardRail } from "@/features/dashboard/components/dashboard-rail";
import type {
  DashboardSummaryItem,
  DashboardView,
} from "@/features/dashboard/components/dashboard-shell.types";
import { pageShellClass } from "@/lib/design-system";

export type {
  DashboardSummaryItem,
  DashboardView,
} from "@/features/dashboard/components/dashboard-shell.types";

export function DashboardShell({
  backHref,
  children,
  logoutDisabled,
  marketDateRange,
  marketId,
  marketName,
  marketStatusIsActive,
  marketStatusLabel,
  onBack,
  onLogout,
  showSummary,
  summaryItems,
  user,
  view,
}: {
  backHref: string | null;
  children: ReactNode;
  logoutDisabled: boolean;
  marketDateRange: string | null;
  marketId: string | null;
  marketName: string | null;
  marketStatusIsActive: boolean;
  marketStatusLabel: string;
  onBack: (href: string) => void;
  onLogout: () => void;
  showSummary: boolean;
  summaryItems: DashboardSummaryItem[];
  user: AuthUser;
  view: DashboardView;
}) {
  const statusLabel = marketStatusIsActive
    ? "LIVE · 진행중"
    : marketName
      ? marketStatusLabel
      : "LEDGER OS";

  return (
    <main className={pageShellClass}>
      <DashboardRail
        logoutDisabled={logoutDisabled}
        marketId={marketId}
        user={user}
        view={view}
        onLogout={onLogout}
      />

      <div className="min-h-screen w-full min-w-0">
        <DashboardHeader
          backHref={backHref}
          marketDateRange={marketDateRange}
          marketName={marketName}
          showSummary={showSummary}
          statusLabel={statusLabel}
          summaryItems={summaryItems}
          user={user}
          view={view}
          onBack={onBack}
        />

        <div className="min-w-0 px-4 py-5 pb-28 sm:px-6 md:py-[30px] md:pb-14 md:pl-[calc(76px+1.5rem)] md:pr-6 lg:pl-[calc(76px+2rem)] lg:pr-8 xl:pl-[calc(76px+2.5rem)] xl:pr-10">
          {children}
        </div>
      </div>
    </main>
  );
}
