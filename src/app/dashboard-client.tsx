"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useMarkets } from "@/hooks/use-markets";
import { useParticipants } from "@/hooks/use-participants";
import { useReceipts } from "@/hooks/use-receipts";
import {
  useSettlementPreview,
  useSettlements,
} from "@/hooks/use-settlement-preview";
import type { Participant } from "@/services/participants.service";
import { useDashboardDialogStore } from "@/stores/dashboard-dialog.store";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import {
  DashboardShell,
  type DashboardView,
} from "@/features/dashboard/components/dashboard-shell";
import { AuditLogScreen } from "@/features/audit-logs/components/audit-log-screen";
import {
  DashboardToast,
  type ToastState,
} from "@/features/dashboard/components/dashboard-toast";
import { HomeView } from "@/features/dashboard/components/home-view";
import { PageStateMessage } from "@/features/dashboard/components/page-state-message";
import { SettingsScreen } from "@/features/fees/components/settings-screen";
import { FeeStatusScreen } from "@/features/fees/components/fee-status-screen";
import { MarketManagementScreen } from "@/features/markets/components/market-management-screen";
import { marketStatusLabels } from "@/features/markets/lib/market-display";
import { BoothProductManagementScreen } from "@/features/participants/components/booth-product-management-screen";
import { BoothMasterManagementScreen } from "@/features/participants/components/booth-master-management-screen";
import { MarketParticipantDialogController } from "@/features/participants/components/market-participant-dialog-controller";
import { ReceiptLookupScreen } from "@/features/receipts/components/receipt-lookup-screen";
import { SalesMatrixScreen } from "@/features/receipts/components/sales-matrix-screen";
import { SettlementScreen } from "@/features/settlements/components/settlement-screen";
import { UserManagementScreen } from "@/features/users/components/user-management-screen";
import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { formatDateRange } from "@/lib/date-format";
import { formatWon } from "@/lib/money";
import { FLEA_MARKET_UNSELECTED_LABEL } from "@/lib/terminology";

function getDashboardBackHref(pathname: string): string | null {
  if (pathname === "/" || pathname === "/management") {
    return null;
  }

  const receiptEditMatch = pathname.match(
    /^\/markets\/([^/]+)\/receipts\/[^/]+\/edit$/,
  );

  if (receiptEditMatch?.[1]) {
    return `/markets/${receiptEditMatch[1]}/receipts`;
  }

  if (pathname.startsWith("/markets/")) {
    return "/markets";
  }

  return "/management";
}

export function DashboardClient({
  marketId,
  receiptId,
  settlementParticipantId,
  view = "home",
}: {
  marketId?: string;
  receiptId?: string;
  settlementParticipantId?: string;
  view?: DashboardView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastIdRef = useRef(0);
  const setRequestedParticipantId = useDashboardUiStore(
    (state) => state.setRequestedParticipantId,
  );
  const openEditParticipantDialogState = useDashboardDialogStore(
    (state) => state.openEditParticipantDialog,
  );
  const currentUser = useCurrentUser();
  const user = currentUser.data ?? null;
  const markets = useMarkets(Boolean(user));
  const selectedMarketId = marketId ?? null;
  const participants = useParticipants(selectedMarketId);
  const receipts = useReceipts(selectedMarketId);
  const settlementPreview = useSettlementPreview(selectedMarketId);
  const settlementHistory = useSettlements(selectedMarketId);
  const logout = useLogout();

  const selectedMarket = useMemo(
    () =>
      markets.data?.find((market) => market.id === selectedMarketId) ?? null,
    [markets.data, selectedMarketId],
  );
  const marketSummaryItems = [
    {
      accent: false,
      label: "BOOTHS",
      value: String(participants.data?.length ?? 0),
    },
    {
      accent: false,
      label: "RECEIPTS",
      value: String(receipts.data?.length ?? 0),
    },
    {
      accent: false,
      label: "총매출",
      value: formatWon(settlementPreview.data?.netSalesAmount ?? 0),
    },
    {
      accent: true,
      label: "정산",
      value:
        (settlementHistory.data?.[0]?.versionNo
          ? `v${settlementHistory.data[0].versionNo}`
          : "미확정") +
        (settlementHistory.data?.[0]?.status
          ? ` · ${settlementStatusLabels[settlementHistory.data[0].status]}`
          : ""),
    },
  ];
  const shouldShowSummary = Boolean(marketId) && view !== "receiptLookup";
  const backHref = getDashboardBackHref(pathname);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((currentToast) =>
        currentToast?.id === toast.id ? null : currentToast,
      );
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!currentUser.isFetched || user) {
      return;
    }

    const currentPath =
      typeof window === "undefined"
        ? pathname
        : `${pathname}${window.location.search}`;

    router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
  }, [currentUser.isFetched, pathname, router, user]);

  function showToast(title: string, message: string) {
    toastIdRef.current += 1;
    setToast({
      id: toastIdRef.current,
      title,
      message,
    });
  }

  async function handleLogout() {
    await logout.mutateAsync();
    setRequestedParticipantId(null);
    router.replace("/login");
  }

  function openParticipantSettingsDialog(participant: Participant) {
    setRequestedParticipantId(participant.id);
    openEditParticipantDialogState(
      participant.id,
      participant.settings?.feeSettingOverrideEnabled === true,
    );
  }

  if (currentUser.isLoading) {
    return <PageStateMessage message="사용자 정보를 확인하는 중입니다." />;
  }

  if (currentUser.isError) {
    return <PageStateMessage message="사용자 정보를 불러오지 못했습니다." />;
  }

  if (!user) {
    return <PageStateMessage message="로그인 페이지로 이동하는 중입니다." />;
  }

  return (
    <DashboardShell
      backHref={backHref}
      logoutDisabled={logout.isPending}
      marketDateRange={
        selectedMarket
          ? formatDateRange(selectedMarket.startsOn, selectedMarket.endsOn)
          : null
      }
      marketId={marketId ?? null}
      marketName={selectedMarket?.name ?? null}
      marketStatusIsActive={selectedMarket?.status === "active"}
      marketStatusLabel={
        selectedMarket ? marketStatusLabels[selectedMarket.status] : "LEDGER OS"
      }
      showSummary={shouldShowSummary}
      summaryItems={marketSummaryItems}
      user={user}
      view={view}
      onBack={(href) => {
        router.push(href);
      }}
      onLogout={handleLogout}
    >
      {view === "home" && <HomeView />}

      {view === "settings" && (
        <SettingsScreen enabled={Boolean(user)} onSaved={showToast} />
      )}

      {view === "users" && (
        <UserManagementScreen
          enabled={Boolean(user)}
          isAdmin={user.role === "admin"}
        />
      )}

      {view === "management" && (
        <MarketManagementScreen
          enabled={Boolean(user)}
          marketId={marketId ?? null}
          onSaved={showToast}
        />
      )}

      {view === "boothMasters" && (
        <BoothMasterManagementScreen enabled={Boolean(user)} />
      )}

      {view === "booths" && (
        <BoothProductManagementScreen
          market={selectedMarket}
          marketId={selectedMarketId}
        />
      )}

      {view === "feeStatus" && (
        <FeeStatusScreen
          marketId={selectedMarketId}
          onEditParticipant={openParticipantSettingsDialog}
        />
      )}

      {(view === "salesMatrix" || view === "receiptEdit") && (
        <SalesMatrixScreen
          market={selectedMarket}
          marketId={selectedMarketId}
          mode={view === "receiptEdit" ? "edit" : "create"}
          onSaved={showToast}
          receiptId={receiptId ?? null}
        />
      )}

      {view === "receiptLookup" && (
        <ReceiptLookupScreen
          market={selectedMarket}
          marketId={selectedMarketId}
          onSaved={showToast}
        />
      )}

      {view === "settlements" && (
        <SettlementScreen
          market={selectedMarket}
          marketId={selectedMarketId}
          selectedParticipantId={settlementParticipantId ?? null}
          onSaved={showToast}
        />
      )}

      {view === "logs" && (
        <AuditLogScreen
          key={selectedMarketId ?? "all"}
          markets={markets.data ?? []}
          selectedMarket={selectedMarket}
          selectedMarketId={selectedMarketId}
        />
      )}
      <MarketParticipantDialogController
        enabled={Boolean(user && selectedMarketId)}
        marketId={selectedMarketId}
        marketName={selectedMarket?.name ?? FLEA_MARKET_UNSELECTED_LABEL}
      />
      <DashboardToast
        toast={toast}
        onDismiss={() => {
          setToast(null);
        }}
      />
    </DashboardShell>
  );
}
