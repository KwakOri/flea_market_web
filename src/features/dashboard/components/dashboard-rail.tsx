"use client";

import Link from "next/link";
import {
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
import type { DashboardView } from "@/features/dashboard/components/dashboard-shell.types";
import { cn } from "@/lib/utils";

const dashboardTabs: Array<{
  icon: LucideIcon;
  label: string;
  segment: string;
  view: DashboardView;
}> = [
  { icon: Store, label: "마켓관리", segment: "management", view: "management" },
  {
    icon: ClipboardList,
    label: "영수증 입력",
    segment: "sales",
    view: "salesMatrix",
  },
  {
    icon: ListChecks,
    label: "영수증 조회",
    segment: "receipts",
    view: "receiptLookup",
  },
  { icon: BarChart3, label: "정산", segment: "settlements", view: "settlements" },
  { icon: Percent, label: "수수료 정책", segment: "fees", view: "feeStatus" },
  { icon: Users, label: "참가 부스", segment: "booths", view: "booths" },
];

export function DashboardRail({
  logoutDisabled,
  marketId,
  onLogout,
  user,
  view,
}: {
  logoutDisabled: boolean;
  marketId: string | null;
  onLogout: () => void;
  user: AuthUser;
  view: DashboardView;
}) {
  const railOpen = useDashboardUiStore((state) => state.railOpen);
  const openRail = useDashboardUiStore((state) => state.openRail);
  const closeRail = useDashboardUiStore((state) => state.closeRail);

  return (
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
