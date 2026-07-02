"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  FileClock,
  ListChecks,
  LogOut,
  Menu,
  Percent,
  Settings,
  Store,
  type LucideIcon,
  Users,
  X,
} from "lucide-react";
import type { AuthUser } from "@/services/auth.service";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import type { DashboardView } from "@/features/dashboard/components/dashboard-shell.types";
import {
  FLEA_MARKET_MANAGE_LABEL,
  PARTICIPATING_SELLER,
  SELLER_MANAGE_LABEL,
} from "@/lib/terminology";
import { cn } from "@/lib/utils";

const dashboardTabs: Array<{
  icon: LucideIcon;
  label: string;
  segment: string;
  view: DashboardView;
}> = [
  {
    icon: Store,
    label: FLEA_MARKET_MANAGE_LABEL,
    segment: "management",
    view: "management",
  },
  { icon: Users, label: PARTICIPATING_SELLER, segment: "booths", view: "booths" },
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
  { icon: Percent, label: "수수료 정책", segment: "fees", view: "feeStatus" },
  { icon: BarChart3, label: "정산", segment: "settlements", view: "settlements" },
  { icon: FileClock, label: "로그", segment: "logs", view: "logs" },
];

const workspaceTabs: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  view: DashboardView;
}> = [
  { href: "/markets", icon: Store, label: FLEA_MARKET_MANAGE_LABEL, view: "management" },
  { href: "/booths", icon: Users, label: SELLER_MANAGE_LABEL, view: "boothMasters" },
  { href: "/settings", icon: Settings, label: "설정", view: "settings" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = getDashboardNavItems(marketId);
  const activeView = view === "receiptEdit" ? "receiptLookup" : view;
  const activeItem = navItems.find((item) => item.view === activeView);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <aside
        className="fixed bottom-3 left-3 top-3 z-[60] hidden flex-col gap-1 overflow-hidden rounded-[12px] bg-[#1f2912] px-3.5 py-[18px] shadow-[6px_0_30px_rgba(20,21,12,0.18)] transition-[width] duration-200 ease-out md:flex"
        onMouseEnter={openRail}
        onMouseLeave={closeRail}
        style={{ width: railOpen ? 248 : 76 }}
      >
        <Link
          className="mb-3 flex h-11 flex-none items-center gap-3 rounded-[8px] pl-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring"
          href="/management"
        >
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-brand-spring font-display text-[17px] font-bold text-brand-deep">
            L
          </span>
          <span
            className="whitespace-nowrap font-display text-[15px] font-semibold text-on-brand-deep transition-opacity"
            style={{ opacity: railOpen ? 1 : 0 }}
          >
            Ledger&nbsp;OS
          </span>
        </Link>

        <nav aria-label="업무 화면" className="grid gap-1">
          {navItems.map((item) => (
            <RailLink
              active={activeView === item.view}
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
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] bg-white/10 text-[13px] font-bold text-brand-spring">
            {user.displayName.charAt(0)}
          </div>
          <div
            className="min-w-0 whitespace-nowrap leading-tight transition-opacity"
            style={{ opacity: railOpen ? 1 : 0 }}
          >
            <div className="truncate text-[13px] font-semibold text-on-brand-deep">
              {user.displayName}
            </div>
            <div
              className="truncate font-mono text-[10.5px] text-on-brand-deep/60"
              data-testid="user-email"
            >
              {user.email}
            </div>
          </div>
        </div>
        <button
          aria-label="로그아웃"
          className="flex h-11 flex-none items-center gap-3 rounded-[8px] px-3 text-on-brand-deep/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring"
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

      <button
        aria-controls="mobile-dashboard-menu"
        aria-expanded={mobileMenuOpen}
        aria-label={mobileMenuOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
        className="fixed right-4 top-4 z-[80] inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#1f2912] text-brand-spring shadow-[0_8px_24px_rgba(20,21,12,0.2)] transition hover:bg-[#1f2912] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring md:hidden"
        onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
        type="button"
      >
        {mobileMenuOpen ? (
          <X aria-hidden className="h-5 w-5" strokeWidth={2.1} />
        ) : (
          <Menu aria-hidden className="h-5 w-5" strokeWidth={2.1} />
        )}
      </button>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            aria-label="모바일 메뉴 닫기"
            className="absolute inset-0 bg-[#1f2912]/45 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          />
          <aside
            aria-label="모바일 업무 메뉴"
            className="absolute bottom-3 right-3 top-3 grid w-[min(320px,calc(100vw-1.5rem))] grid-rows-[auto_auto_1fr_auto] overflow-hidden rounded-[16px] bg-[#1f2912] p-4 shadow-[0_18px_60px_rgba(20,21,12,0.3)]"
            id="mobile-dashboard-menu"
          >
            <Link
              className="flex h-12 items-center gap-3 rounded-[12px] pr-12 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring"
              href="/management"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[8px] bg-brand-spring font-display text-lg font-bold text-brand-deep">
                L
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-[15px] font-semibold text-on-brand-deep">
                  Ledger OS
                </span>
                <span className="block truncate font-mono text-[10.5px] text-on-brand-deep/60">
                  {activeItem?.label ?? "메뉴"}
                </span>
              </span>
            </Link>

            <div className="mt-4 rounded-[12px] bg-black/20 px-3 py-3">
              <div className="text-[13px] font-semibold text-on-brand-deep">
                {user.displayName}
              </div>
              <div
                className="mt-0.5 truncate font-mono text-[10.5px] text-on-brand-deep/60"
                data-testid="mobile-user-email"
              >
                {user.email}
              </div>
            </div>

            <nav
              aria-label="모바일 업무 화면"
              className="mt-4 grid content-start gap-1.5 overflow-y-auto pr-1"
            >
              {navItems.map((item) => (
                <MobileDrawerLink
                  active={activeView === item.view}
                  href={item.href}
                  icon={item.icon}
                  key={item.href}
                  label={item.label}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>

            <button
              aria-label="로그아웃"
              className="mt-4 flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm font-semibold text-on-brand-deep/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring"
              disabled={logoutDisabled}
              onClick={onLogout}
              type="button"
            >
              <LogOut aria-hidden className="h-5 w-5 flex-none" />
              로그아웃
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

function getDashboardNavItems(marketId: string | null) {
  if (!marketId) {
    return workspaceTabs.map((tab) => ({
      href: tab.href,
      icon: tab.icon,
      label: tab.label,
      view: tab.view,
    }));
  }

  return dashboardTabs.map((tab) => ({
    href: `/markets/${marketId}/${tab.segment}`,
    icon: tab.icon,
    label: tab.label,
    view: tab.view,
  }));
}

function MobileDrawerLink({
  active,
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  active: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring",
        active
          ? "bg-brand-spring text-brand-deep"
          : "text-on-brand-deep/80 hover:bg-white/10 hover:text-white",
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon aria-hidden className="h-5 w-5 flex-none" strokeWidth={1.8} />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
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
        "flex h-[46px] flex-none items-center gap-3.5 rounded-[8px] px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring",
        active
          ? "bg-brand-spring text-brand-deep"
          : "text-on-brand-deep/80 hover:bg-white/10 hover:text-white",
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
