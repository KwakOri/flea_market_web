"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  ListChecks,
  LogOut,
  Percent,
  Settings,
  Store,
  type LucideIcon,
  Users,
} from "lucide-react";
import type { AuthUser } from "@/services/auth.service";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import { buttonVariants, pageShellClass } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export type DashboardView =
  | "home"
  | "settings"
  | "management"
  | "boothMasters"
  | "booths"
  | "feeStatus"
  | "salesMatrix"
  | "receiptLookup"
  | "settlements";

export type DashboardSummaryItem = {
  accent: boolean;
  label: string;
  value: string;
};

const dashboardViewLabels: Record<DashboardView, string> = {
  home: "관리 홈",
  settings: "설정",
  management: "마켓관리",
  boothMasters: "부스관리",
  booths: "참가부스관리",
  feeStatus: "수수료 현황",
  salesMatrix: "영수증 입력",
  receiptLookup: "영수증 조회",
  settlements: "정산",
};

const dashboardTabs: Array<{
  icon: LucideIcon;
  label: string;
  segment: string;
  view: DashboardView;
}> = [
  { icon: Store, label: "마켓관리", segment: "management", view: "management" },
  { icon: ClipboardList, label: "영수증 입력", segment: "sales", view: "salesMatrix" },
  { icon: ListChecks, label: "영수증 조회", segment: "receipts", view: "receiptLookup" },
  { icon: BarChart3, label: "정산", segment: "settlements", view: "settlements" },
  { icon: Percent, label: "수수료 정책", segment: "fees", view: "feeStatus" },
  { icon: Users, label: "참가 부스", segment: "booths", view: "booths" },
];

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
  const railOpen = useDashboardUiStore((state) => state.railOpen);
  const openRail = useDashboardUiStore((state) => state.openRail);
  const closeRail = useDashboardUiStore((state) => state.closeRail);
  const statusLabel = marketStatusIsActive
    ? "LIVE · 진행중"
    : marketName
      ? marketStatusLabel
      : "LEDGER OS";

  return (
    <main className={pageShellClass}>
      <aside
        className="fixed bottom-3 left-3 top-3 z-[60] flex flex-col gap-1 overflow-hidden rounded-[18px] bg-[#16170f] px-3.5 py-[18px] shadow-[6px_0_30px_rgba(20,21,12,0.18)] transition-[width] duration-200 ease-out"
        onMouseEnter={openRail}
        onMouseLeave={closeRail}
        style={{ width: railOpen ? 248 : 76 }}
      >
        <Link
          className="mb-3 flex h-11 flex-none items-center gap-3 rounded-[11px] pl-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b]"
          href="/management"
        >
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-[#c7f94b] font-display text-[17px] font-bold text-[#16170f]">
            L
          </span>
          <span
            className="whitespace-nowrap font-display text-[15px] font-semibold text-[#f3f0e2] transition-opacity"
            style={{ opacity: railOpen ? 1 : 0 }}
          >
            Ledger&nbsp;OS
          </span>
        </Link>

        <nav aria-label="업무 화면" className="grid gap-1">
          {marketId
            ? dashboardTabs.map((tab) => (
                <RailLink
                  active={view === tab.view}
                  href={`/markets/${marketId}/${tab.segment}`}
                  icon={tab.icon}
                  key={tab.view}
                  label={tab.label}
                  railOpen={railOpen}
                />
              ))
            : [
                {
                  active: view === "management",
                  href: "/markets",
                  icon: Store,
                  label: "마켓 관리",
                },
                {
                  active: view === "boothMasters",
                  href: "/booths",
                  icon: Users,
                  label: "부스 관리",
                },
                {
                  active: view === "settings",
                  href: "/settings",
                  icon: Settings,
                  label: "설정",
                },
              ].map((item) => (
                <RailLink
                  active={item.active}
                  href={item.href}
                  icon={item.icon}
                  key={item.href}
                  label={item.label}
                  railOpen={railOpen}
                />
              ))}
        </nav>

        <div className="flex-1" />
        <div className="flex h-12 flex-none items-center gap-3 px-2">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-[#2a2b20] text-[13px] font-bold text-[#c7f94b]">
            {user.displayName.charAt(0)}
          </div>
          <div
            className="min-w-0 whitespace-nowrap leading-tight transition-opacity"
            style={{ opacity: railOpen ? 1 : 0 }}
          >
            <div className="truncate text-[13px] font-semibold text-[#f3f0e2]">
              {user.displayName}
            </div>
            <div
              className="truncate font-mono text-[10.5px] text-[#7d7c6a]"
              data-testid="user-email"
            >
              {user.email}
            </div>
          </div>
        </div>
        <button
          aria-label="로그아웃"
          className="flex h-11 flex-none items-center gap-3 rounded-[11px] px-3 text-[#cfccba] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b]"
          disabled={logoutDisabled}
          onClick={onLogout}
          type="button"
        >
          <LogOut aria-hidden className="h-[21px] w-[21px] flex-none" />
          <span
            className="whitespace-nowrap text-sm font-semibold transition-opacity"
            style={{ opacity: railOpen ? 1 : 0 }}
          >
            로그아웃
          </span>
        </button>
      </aside>

      <div className="min-h-screen w-full min-w-0">
        <header className="sticky top-0 z-40 border-b border-[#d8d3c2] bg-[#e9e5d8]/80 py-[18px] pl-[calc(76px+1.5rem)] pr-5 backdrop-blur-md sm:pl-[calc(76px+2rem)] sm:pr-8 lg:pl-[calc(76px+2.5rem)] lg:pr-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
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
                <span className="pb-0.5 font-mono text-[11.5px] text-[#8a8775]">
                  {marketDateRange}
                </span>
              )}
            </div>

            {showSummary ? (
              <div className="flex min-w-0 items-stretch overflow-hidden rounded-[14px] border border-[#d8d3c2] bg-[#fbf9f1]">
                {summaryItems.map((item, index) => (
                  <div
                    className={cn(
                      "min-w-[112px] px-[18px] py-2.5",
                      index > 0 && "border-l border-[#e7e2d2]",
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
                        "mt-0.5 whitespace-nowrap font-display text-[19px] font-bold",
                        item.accent && "text-[#a9791f]",
                      )}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
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

        <div className="min-w-0 py-[30px] pb-14 pl-[calc(76px+1.5rem)] pr-5 sm:pl-[calc(76px+2rem)] sm:pr-8 lg:pl-[calc(76px+2.5rem)] lg:pr-10">
          {children}
        </div>
      </div>
    </main>
  );
}

function RailLink({
  active,
  href,
  icon: Icon,
  label,
  railOpen,
}: {
  active: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
  railOpen: boolean;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-[46px] flex-none items-center gap-3.5 rounded-[11px] px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b]",
        active
          ? "bg-[#c7f94b] text-[#16170f]"
          : "text-[#cfccba] hover:bg-white/10 hover:text-white",
      )}
      href={href}
    >
      <Icon
        aria-hidden
        className="h-[21px] w-[21px] flex-none"
        strokeWidth={1.8}
      />
      <span
        className="whitespace-nowrap transition-opacity"
        style={{ opacity: railOpen ? 1 : 0 }}
      >
        {label}
      </span>
    </Link>
  );
}
