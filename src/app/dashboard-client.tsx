"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import {
  useCreateMarket,
  useMarkets,
  useUpdateMarket,
} from "@/hooks/use-markets";
import {
  useCreateParticipant,
  useCreateParticipantMaster,
  useDeleteParticipantFromMarket,
  useParticipantMasters,
  useParticipants,
  useUpdateParticipantMaster,
  useUpdateParticipantForMarket,
} from "@/hooks/use-participants";
import {
  useCreateProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/use-products";
import {
  useCreateReceipt,
  useReceipts,
} from "@/hooks/use-receipts";
import {
  useCreateSettlement,
  useDownloadSettlementPdfArchive,
  useSettlementPreview,
  useSettlements,
} from "@/hooks/use-settlement-preview";
import {
  useGlobalSettlementSettings,
  useMarketSettlementSettings,
  useUpdateMarketSettlementSettings,
} from "@/hooks/use-settlement-settings";
import type { Market, MarketStatus } from "@/services/markets.service";
import type {
  Participant,
  ParticipantStatus,
  ParticipantType,
} from "@/services/participants.service";
import type { ProductStatus } from "@/services/products.service";
import type {
  CreateReceiptPayload,
  CreateReceiptPaymentSplitPayload,
  PaymentMethod,
} from "@/services/receipts.service";
import { useDashboardDialogStore } from "@/stores/dashboard-dialog.store";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import {
  DashboardShell,
  type DashboardView,
} from "@/features/dashboard/components/dashboard-shell";
import {
  DashboardToast,
  type ToastState,
} from "@/features/dashboard/components/dashboard-toast";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { HomeView } from "@/features/dashboard/components/home-view";
import { PageStateMessage } from "@/features/dashboard/components/page-state-message";
import { SettingsScreen } from "@/features/fees/components/settings-screen";
import { FeeStatusView } from "@/features/fees/components/fee-status-view";
import { getFeeSettingsPayload } from "@/features/fees/lib/fee-settings-payload";
import { ParticipantDialog } from "@/features/participants/components/participant-dialogs";
import { MarketManagementView } from "@/features/markets/components/market-management-view";
import { MarketDialog } from "@/features/markets/components/market-dialog";
import { marketStatusLabels } from "@/features/markets/lib/market-display";
import { BoothProductManagementView } from "@/features/participants/components/booth-product-management-view";
import { BoothMasterManagementView } from "@/features/participants/components/booth-master-management-view";
import { ReceiptLookupView } from "@/features/receipts/components/receipt-lookup-view";
import { SalesMatrixView } from "@/features/receipts/components/sales-matrix-view";
import {
  buildReceiptSoldAtFromDateTimeInput,
  getDefaultReceiptDateTimeInputValue,
} from "@/features/receipts/lib/receipt-date-time";
import { SettlementPreviewPanel } from "@/features/settlements/components/settlement-preview-panel";
import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { panelVariants } from "@/lib/design-system";
import { formatDateRange } from "@/lib/date-format";
import { getErrorMessage } from "@/lib/error-message";
import { formatWon } from "@/lib/money";
import {
  parseReceiptAmountInput,
  paymentMethods,
} from "@/lib/receipt-matrix";

type ReceiptLineDraft = {
  participantId: string;
  participantName: string;
  amount: number;
};

function getDashboardBackHref(pathname: string): string | null {
  if (pathname === "/" || pathname === "/management") {
    return null;
  }

  if (pathname.startsWith("/markets/")) {
    return "/markets";
  }

  return "/management";
}

export function DashboardClient({
  marketId,
  settlementParticipantId,
  view = "home",
}: {
  marketId?: string;
  settlementParticipantId?: string;
  view?: DashboardView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [marketMessage, setMarketMessage] = useState<string | null>(null);
  const [participantMasterMessage, setParticipantMasterMessage] = useState<
    string | null
  >(null);
  const [participantMessage, setParticipantMessage] = useState<string | null>(
    null,
  );
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [settlementMessage, setSettlementMessage] = useState<string | null>(
    null,
  );
  const [marketFeeSettingsMessage, setMarketFeeSettingsMessage] = useState<
    string | null
  >(null);
  const toastIdRef = useRef(0);
  const resetMatrixReceiptDraft = useReceiptMatrixStore(
    (state) => state.resetReceiptDraft,
  );
  const requestedParticipantId = useDashboardUiStore(
    (state) => state.requestedParticipantId,
  );
  const setRequestedParticipantId = useDashboardUiStore(
    (state) => state.setRequestedParticipantId,
  );
  const marketDialogMode = useDashboardDialogStore(
    (state) => state.marketDialogMode,
  );
  const editingMarketId = useDashboardDialogStore(
    (state) => state.editingMarketId,
  );
  const participantFeeOverrideEnabled = useDashboardDialogStore(
    (state) => state.participantFeeOverrideEnabled,
  );
  const participantDialogMode = useDashboardDialogStore(
    (state) => state.participantDialogMode,
  );
  const editingParticipantId = useDashboardDialogStore(
    (state) => state.editingParticipantId,
  );
  const participantMasterDialogMode = useDashboardDialogStore(
    (state) => state.participantMasterDialogMode,
  );
  const editingParticipantMasterId = useDashboardDialogStore(
    (state) => state.editingParticipantMasterId,
  );
  const openCreateMarketDialogState = useDashboardDialogStore(
    (state) => state.openCreateMarketDialog,
  );
  const openEditMarketDialogState = useDashboardDialogStore(
    (state) => state.openEditMarketDialog,
  );
  const closeMarketDialogState = useDashboardDialogStore(
    (state) => state.closeMarketDialog,
  );
  const openCreateParticipantDialogState = useDashboardDialogStore(
    (state) => state.openCreateParticipantDialog,
  );
  const openEditParticipantDialogState = useDashboardDialogStore(
    (state) => state.openEditParticipantDialog,
  );
  const closeParticipantDialogState = useDashboardDialogStore(
    (state) => state.closeParticipantDialog,
  );
  const openCreateParticipantMasterDialogState = useDashboardDialogStore(
    (state) => state.openCreateParticipantMasterDialog,
  );
  const openEditParticipantMasterDialogState = useDashboardDialogStore(
    (state) => state.openEditParticipantMasterDialog,
  );
  const closeParticipantMasterDialogState = useDashboardDialogStore(
    (state) => state.closeParticipantMasterDialog,
  );
  const setParticipantFeeOverrideEnabled = useDashboardDialogStore(
    (state) => state.setParticipantFeeOverrideEnabled,
  );
  const currentUser = useCurrentUser();
  const user = currentUser.data ?? null;
  const markets = useMarkets(Boolean(user));
  const selectedMarketId = marketId ?? null;
  const createMarket = useCreateMarket();
  const updateMarket = useUpdateMarket();
  const participants = useParticipants(selectedMarketId);
  const participantMasters = useParticipantMasters(Boolean(user));
  const selectedParticipantId = useMemo(() => {
    if (!participants.data?.length) {
      return null;
    }

    const requestedParticipant = participants.data.find(
      (participant) => participant.id === requestedParticipantId,
    );

    return requestedParticipant?.id ?? participants.data[0].id;
  }, [participants.data, requestedParticipantId]);
  const createParticipantMaster = useCreateParticipantMaster();
  const updateParticipantMaster = useUpdateParticipantMaster();
  const createParticipant = useCreateParticipant(selectedMarketId);
  const deleteParticipantFromMarket =
    useDeleteParticipantFromMarket(selectedMarketId);
  const updateParticipantForMarket =
    useUpdateParticipantForMarket(selectedMarketId);
  const products = useProducts(selectedMarketId, selectedParticipantId);
  const createProduct = useCreateProduct(
    selectedMarketId,
    selectedParticipantId,
  );
  const updateProduct = useUpdateProduct(
    selectedMarketId,
    selectedParticipantId,
  );
  const receipts = useReceipts(selectedMarketId);
  const createReceipt = useCreateReceipt(selectedMarketId);
  const settlementPreview = useSettlementPreview(selectedMarketId);
  const settlementHistory = useSettlements(selectedMarketId);
  const createSettlementSnapshot = useCreateSettlement(selectedMarketId);
  const downloadSettlementPdfArchive =
    useDownloadSettlementPdfArchive(selectedMarketId);
  const globalFeeSettings = useGlobalSettlementSettings(Boolean(user));
  const marketFeeSettings = useMarketSettlementSettings(selectedMarketId);
  const updateMarketFeeSettings =
    useUpdateMarketSettlementSettings(selectedMarketId);
  const logout = useLogout();

  const selectedMarket = useMemo(
    () =>
      markets.data?.find((market) => market.id === selectedMarketId) ?? null,
    [markets.data, selectedMarketId],
  );
  const editingMarket = useMemo(
    () => markets.data?.find((market) => market.id === editingMarketId) ?? null,
    [editingMarketId, markets.data],
  );
  const selectedParticipant = useMemo(
    () =>
      participants.data?.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null,
    [participants.data, selectedParticipantId],
  );
  const editingParticipant = useMemo(
    () =>
      participants.data?.find(
        (participant) => participant.id === editingParticipantId,
      ) ?? null,
    [editingParticipantId, participants.data],
  );
  const editingParticipantMaster = useMemo(
    () =>
      participantMasters.data?.find(
        (participant) => participant.id === editingParticipantMasterId,
      ) ?? null,
    [editingParticipantMasterId, participantMasters.data],
  );
  const marketSummaryItems = [
    { accent: false, label: "BOOTHS", value: String(participants.data?.length ?? 0) },
    { accent: false, label: "RECEIPTS", value: String(receipts.data?.length ?? 0) },
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
  const linkedParticipantIds = useMemo(
    () =>
      new Set(
        (participants.data ?? []).map((participant) => participant.id),
      ),
    [participants.data],
  );
  const unlinkedParticipantMasters = useMemo(() => {
    return (participantMasters.data ?? []).filter(
      (participant) => !linkedParticipantIds.has(participant.id),
    );
  }, [linkedParticipantIds, participantMasters.data]);
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

  useEffect(() => {
    resetMatrixReceiptDraft();
  }, [resetMatrixReceiptDraft, selectedMarketId]);

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

  if (currentUser.isLoading) {
    return <PageStateMessage message="사용자 정보를 확인하는 중입니다." />;
  }

  if (currentUser.isError) {
    return <PageStateMessage message="사용자 정보를 불러오지 못했습니다." />;
  }

  if (!user) {
    return <PageStateMessage message="로그인 페이지로 이동하는 중입니다." />;
  }

  async function handleCreateMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMarketMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const market = await createMarket.mutateAsync({
        name: getFormString(formData, "name"),
        description: getOptionalFormString(formData, "description"),
        startsOn: getOptionalFormString(formData, "startsOn"),
        endsOn: getOptionalFormString(formData, "endsOn"),
      });

      setRequestedParticipantId(null);
      form.reset();
      closeMarketDialog();
      router.push(`/markets/${market.id}/management`);
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMarketMessage(null);

    if (!editingMarket) {
      setMarketMessage("수정할 플리마켓을 선택해주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = getFormString(formData, "name");

    if (!name.trim()) {
      setMarketMessage("마켓명을 입력해주세요.");
      return;
    }

    try {
      await updateMarket.mutateAsync({
        marketId: editingMarket.id,
        payload: {
          name,
          description: getFormString(formData, "description").trim(),
          status: getFormString(formData, "status") as MarketStatus,
          startsOn: getOptionalFormString(formData, "startsOn"),
          endsOn: getOptionalFormString(formData, "endsOn"),
        },
      });
      closeMarketDialog();
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
  }

  function openCreateMarketDialog() {
    setMarketMessage(null);
    openCreateMarketDialogState();
  }

  function openEditMarketDialog(market: Market) {
    setMarketMessage(null);
    openEditMarketDialogState(market.id);
  }

  function closeMarketDialog() {
    closeMarketDialogState();
    setMarketMessage(null);
  }

  async function handleUpdateMarketFeeSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMarketFeeSettingsMessage(null);

    try {
      await updateMarketFeeSettings.mutateAsync(
        getFeeSettingsPayload(new FormData(event.currentTarget)),
      );
      showToast(
        "플리마켓 수수료 저장 완료",
        "플리마켓 수수료 기본값을 저장했습니다.",
      );
    } catch (error) {
      setMarketFeeSettingsMessage(getErrorMessage(error));
    }
  }

  async function handleCreateParticipantMaster(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setParticipantMasterMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const displayName = getFormString(formData, "displayName");

    if (!displayName.trim()) {
      setParticipantMasterMessage("참가부스명을 입력해주세요.");
      return;
    }

    try {
      await createParticipantMaster.mutateAsync({
        displayName,
        participantType: getFormString(
          formData,
          "participantType",
        ) as ParticipantType,
        contactName: getOptionalFormString(formData, "contactName"),
        phone: getOptionalFormString(formData, "phone"),
        email: getOptionalFormString(formData, "email"),
        memo: getOptionalFormString(formData, "memo"),
      });

      form.reset();
      closeParticipantMasterDialog();
    } catch (error) {
      setParticipantMasterMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateParticipantMaster(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setParticipantMasterMessage(null);

    if (!editingParticipantMaster) {
      setParticipantMasterMessage("수정할 부스를 선택해주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const displayName = getFormString(formData, "displayName");

    if (!displayName.trim()) {
      setParticipantMasterMessage("부스명을 입력해주세요.");
      return;
    }

    try {
      await updateParticipantMaster.mutateAsync({
        participantId: editingParticipantMaster.id,
        payload: {
          displayName,
          participantType: getFormString(
            formData,
            "participantType",
          ) as ParticipantType,
          contactName: getNullableFormString(formData, "contactName"),
          phone: getNullableFormString(formData, "phone"),
          email: getNullableFormString(formData, "email"),
          memo: getNullableFormString(formData, "memo"),
          status: getFormString(formData, "status") as ParticipantStatus,
        },
      });

      closeParticipantMasterDialog();
    } catch (error) {
      setParticipantMasterMessage(getErrorMessage(error));
    }
  }

  function openCreateParticipantMasterDialog() {
    setParticipantMasterMessage(null);
    openCreateParticipantMasterDialogState();
  }

  function openEditParticipantMasterDialog(participant: Participant) {
    setParticipantMasterMessage(null);
    openEditParticipantMasterDialogState(participant.id);
  }

  function closeParticipantMasterDialog() {
    closeParticipantMasterDialogState();
    setParticipantMasterMessage(null);
  }

  async function handleCreateParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParticipantMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const participantId = getOptionalFormString(formData, "participantId");

    if (!participantId) {
      setParticipantMessage("연결할 참가부스를 선택해주세요.");
      return;
    }

    try {
      const feeSettingOverrideEnabled = getCheckboxValue(
        formData,
        "feeSettingOverrideEnabled",
      );
      const participant = await createParticipant.mutateAsync({
        participantId,
        participantType: getFormString(
          formData,
          "participantType",
        ) as ParticipantType,
        feeSettingOverrideEnabled,
        ...(feeSettingOverrideEnabled ? getFeeSettingsPayload(formData) : {}),
      });

      setRequestedParticipantId(participant.id);
      form.reset();
      closeParticipantDialog();
    } catch (error) {
      setParticipantMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParticipantMessage(null);

    if (!editingParticipant) {
      setParticipantMessage("수정할 참가부스를 선택해주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const feeSettingOverrideEnabled = getCheckboxValue(
      formData,
      "feeSettingOverrideEnabled",
    );

    try {
      const participant = await updateParticipantForMarket.mutateAsync({
        participantId: editingParticipant.id,
        payload: {
          participantType: getFormString(
            formData,
            "participantType",
          ) as ParticipantType,
          feeSettingOverrideEnabled,
          ...(feeSettingOverrideEnabled ? getFeeSettingsPayload(formData) : {}),
        },
      });

      setRequestedParticipantId(participant.id);
      closeParticipantDialog();
    } catch (error) {
      setParticipantMessage(getErrorMessage(error));
    }
  }

  async function handleDeleteParticipantFromMarket(participant: Participant) {
    setParticipantMessage(null);

    const confirmed = window.confirm(
      `${participant.displayName} 참가부스를 이 플리마켓에서 삭제할까요? 전체 부스 정보는 유지됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteParticipantFromMarket.mutateAsync(participant.id);

      setRequestedParticipantId((currentParticipantId) =>
        currentParticipantId === participant.id ? null : currentParticipantId,
      );
    } catch (error) {
      setParticipantMessage(getErrorMessage(error));
    }
  }

  function openCreateParticipantDialog() {
    setParticipantMessage(null);
    openCreateParticipantDialogState();
  }

  function openEditParticipantDialog(participant: Participant) {
    setParticipantMessage(null);
    setRequestedParticipantId(participant.id);
    openEditParticipantDialogState(
      participant.id,
      participant.settings?.feeSettingOverrideEnabled === true,
    );
  }

  function closeParticipantDialog() {
    closeParticipantDialogState();
    setParticipantMessage(null);
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await createProduct.mutateAsync({
        name: getFormString(formData, "name"),
        sku: getOptionalFormString(formData, "sku"),
        priceAmount: getRequiredNumber(
          formData,
          "priceAmount",
          "가격을 입력해주세요.",
        ),
      });

      form.reset();
    } catch (error) {
      setProductMessage(getErrorMessage(error));
    }
  }

  async function handleProductStatusChange(
    productId: string,
    status: ProductStatus,
  ) {
    setProductMessage(null);

    try {
      await updateProduct.mutateAsync({
        productId,
        payload: { status },
      });
    } catch (error) {
      setProductMessage(getErrorMessage(error));
    }
  }

  async function handleCreateMatrixReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReceiptMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const receiptMatrixState = useReceiptMatrixStore.getState();
      const receiptDateTimeEnabled =
        receiptMatrixState.receiptDateTimeDraft?.marketId === selectedMarketId &&
        receiptMatrixState.receiptDateTimeDraft.enabled;
      const receiptDateTimeValue =
        receiptDateTimeEnabled && receiptMatrixState.receiptDateTimeDraft?.value
          ? receiptMatrixState.receiptDateTimeDraft.value
          : getDefaultReceiptDateTimeInputValue(
              selectedMarket?.startsOn ?? null,
              selectedMarket?.endsOn ?? null,
            );
      const soldAt = receiptDateTimeEnabled
        ? buildReceiptSoldAtFromDateTimeInput(
            receiptDateTimeValue,
            selectedMarket?.startsOn ?? null,
            selectedMarket?.endsOn ?? null,
          )
        : new Date().toISOString();
      const saleLines = getReceiptLinesFromAmounts(
        receiptMatrixState.receiptAmounts,
        participants.data ?? [],
      );

      const receipt = await createReceipt.mutateAsync(
        buildReceiptPayload({
          customerLabel: getOptionalFormString(formData, "customerLabel"),
          memo: getOptionalFormString(formData, "memo"),
          paymentMethod:
            receiptMatrixState.paymentMode === "single"
              ? receiptMatrixState.singlePaymentMethod
              : "",
          paymentSplits:
            receiptMatrixState.paymentMode === "split"
              ? getPaymentSplitsFromAmounts(receiptMatrixState.paymentSplits)
              : undefined,
          saleLines,
          soldAt,
        }),
      );

      resetMatrixReceiptDraft();
      form.reset();
      showToast(
        "영수증 저장 완료",
        `${formatWon(receipt.totalAmount)} 영수증을 저장했습니다.`,
      );
    } catch (error) {
      setReceiptMessage(getErrorMessage(error));
    }
  }

  async function handleConfirmSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettlementMessage(null);

    if (!settlementPreview.data || settlementPreview.data.receiptCount === 0) {
      setSettlementMessage("확정할 영수증이 없습니다.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const settlement = await createSettlementSnapshot.mutateAsync({
        memo: getOptionalFormString(formData, "memo"),
      });

      showToast(
        "정산 확정 완료",
        `v${settlement.versionNo} 정산이 확정되었습니다.`,
      );
      form.reset();
    } catch (error) {
      setSettlementMessage(getErrorMessage(error));
    }
  }

  async function handleDownloadSettlementPdfs() {
    setSettlementMessage(null);

    if (!settlementPreview.data || settlementPreview.data.receiptCount === 0) {
      setSettlementMessage("저장할 영수증이 없습니다.");
      return;
    }

    try {
      const result = await downloadSettlementPdfArchive.mutateAsync();
      downloadBlob(result.blob, result.filename);
      showToast(
        "PDF 다운로드 완료",
        "부스별 정산 PDF를 다운로드했습니다.",
      );
    } catch (error) {
      setSettlementMessage(getErrorMessage(error));
    }
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

        {view === "home" && (
          <HomeView />
        )}

        {view === "settings" && (
          <SettingsScreen enabled={Boolean(user)} onSaved={showToast} />
        )}

        {view === "management" && (
          <MarketManagementView
            createMarketDisabled={createMarket.isPending}
            marketFeeSettings={marketFeeSettings.data}
            marketFeeSettingsDisabled={
              marketFeeSettings.isLoading || updateMarketFeeSettings.isPending
            }
            marketFeeSettingsMessage={marketFeeSettingsMessage}
            marketFeeSettingsSubmitLabel={
              updateMarketFeeSettings.isPending ? "저장 중" : "저장"
            }
            marketId={marketId ?? null}
            marketMessage={marketMessage}
            markets={markets.data ?? []}
            selectedMarket={selectedMarket}
            onCreateMarket={openCreateMarketDialog}
            onEditMarket={openEditMarketDialog}
            onSelectMarket={(selectedId) =>
              router.push(`/markets/${selectedId}/management`)
            }
            onUpdateMarketFeeSettings={handleUpdateMarketFeeSettings}
          />
        )}

        {marketDialogMode && (
          <MarketDialog
            editingMarket={editingMarket}
            isSubmitting={createMarket.isPending || updateMarket.isPending}
            message={marketMessage}
            mode={marketDialogMode}
            onClose={closeMarketDialog}
            onCreateSubmit={handleCreateMarket}
            onUpdateSubmit={handleUpdateMarket}
          />
        )}

        {view === "boothMasters" && (
          <BoothMasterManagementView
            createDisabled={createParticipantMaster.isPending}
            dialogMode={participantMasterDialogMode}
            editingParticipant={editingParticipantMaster}
            isSubmitting={
              createParticipantMaster.isPending ||
              updateParticipantMaster.isPending
            }
            message={participantMasterMessage}
            participants={participantMasters.data ?? []}
            onCloseDialog={closeParticipantMasterDialog}
            onCreate={openCreateParticipantMasterDialog}
            onCreateSubmit={handleCreateParticipantMaster}
            onEditParticipant={openEditParticipantMasterDialog}
            onUpdateSubmit={handleUpdateParticipantMaster}
          />
        )}

        {view === "booths" && (
          <BoothProductManagementView
            createParticipantDisabled={
              !selectedMarket ||
              !unlinkedParticipantMasters.length ||
              createParticipant.isPending
            }
            createProductDisabled={
              !selectedParticipant || createProduct.isPending
            }
            deleteParticipantDisabled={deleteParticipantFromMarket.isPending}
            globalSettings={globalFeeSettings.data ?? null}
            marketSettings={marketFeeSettings.data ?? null}
            participants={participants.data ?? []}
            participantDialogOpen={Boolean(participantDialogMode)}
            participantMessage={participantMessage}
            products={products.data ?? []}
            productMessage={productMessage}
            selectedMarket={selectedMarket}
            selectedParticipant={selectedParticipant}
            selectedParticipantId={selectedParticipantId}
            onCreateParticipant={openCreateParticipantDialog}
            onCreateProductSubmit={handleCreateProduct}
            onDeleteParticipant={handleDeleteParticipantFromMarket}
            onEditParticipant={openEditParticipantDialog}
            onProductStatusChange={handleProductStatusChange}
          />
        )}

        {view === "feeStatus" && (
          <FeeStatusView
            globalSettings={globalFeeSettings.data ?? null}
            isLoading={
              globalFeeSettings.isLoading ||
              marketFeeSettings.isLoading ||
              participants.isLoading
            }
            marketId={marketId ?? null}
            marketSettings={marketFeeSettings.data ?? null}
            participants={participants.data ?? []}
            onEditParticipant={openEditParticipantDialog}
          />
        )}

        {view === "salesMatrix" && (
          <SalesMatrixView
            isSubmitting={createReceipt.isPending}
            participants={participants.data ?? []}
            receiptMessage={receiptMessage}
            selectedMarket={selectedMarket}
            selectedMarketId={selectedMarketId}
            onSubmit={handleCreateMatrixReceipt}
          />
        )}

        {view === "receiptLookup" && (
          <ReceiptLookupView
            dateRangeLabel={formatDateRange(
              selectedMarket?.startsOn ?? null,
              selectedMarket?.endsOn ?? null,
            )}
            isLoading={participants.isLoading || receipts.isLoading}
            participants={participants.data ?? []}
            receipts={receipts.data ?? []}
          />
        )}

        {view === "settlements" && (
          <div>
            <DashboardPageTitle
              eyebrow={selectedMarket?.name ?? "마켓 미선택"}
              subtitle="확정 시 현재 정산 결과가 회차 스냅샷으로 저장됩니다."
              title="정산 프리뷰 / 확정"
            />
            <section className={panelVariants()}>
                <SettlementPreviewPanel
                  history={settlementHistory.data ?? []}
                  isConfirming={createSettlementSnapshot.isPending}
                  isDownloading={downloadSettlementPdfArchive.isPending}
                  isHistoryLoading={settlementHistory.isLoading}
                  isLoading={settlementPreview.isLoading}
                  isReceiptsLoading={receipts.isLoading}
                  market={selectedMarket}
                  message={settlementMessage}
                  preview={settlementPreview.data ?? null}
                  receipts={receipts.data ?? []}
                  selectedParticipantId={settlementParticipantId ?? null}
                  onConfirm={handleConfirmSettlement}
                  onDownloadPdfs={handleDownloadSettlementPdfs}
                  onBackToParticipantList={() => {
                    if (selectedMarketId) {
                      router.push(`/markets/${selectedMarketId}/settlements`);
                    }
                  }}
                  onOpenParticipantDetail={(participantId) => {
                    if (selectedMarketId) {
                      router.push(
                        `/markets/${selectedMarketId}/settlements/${participantId}`,
                      );
                    }
                  }}
                  onOpenSettlementDetail={(settlementId) => {
                    if (selectedMarketId) {
                      router.push(
                        `/markets/${selectedMarketId}/settlements/versions/${settlementId}`,
                      );
                    }
                  }}
                />
            </section>
          </div>
        )}
        {participantDialogMode && (
          <ParticipantDialog
            editingParticipant={editingParticipant}
            feeOverrideEnabled={participantFeeOverrideEnabled}
            isSubmitting={
              createParticipant.isPending ||
              updateParticipantForMarket.isPending
            }
            marketName={selectedMarket?.name ?? "마켓 미선택"}
            message={participantMessage}
            mode={participantDialogMode}
            unlinkedParticipants={unlinkedParticipantMasters}
            onClose={closeParticipantDialog}
            onCreateSubmit={handleCreateParticipant}
            onFeeOverrideChange={setParticipantFeeOverrideEnabled}
            onUpdateSubmit={handleUpdateParticipant}
          />
        )}
        <DashboardToast
          toast={toast}
          onDismiss={() => {
            setToast(null);
          }}
        />
    </DashboardShell>
  );
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getCheckboxValue(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

function getOptionalFormString(
  formData: FormData,
  name: string,
): string | undefined {
  const value = getFormString(formData, name).trim();
  return value || undefined;
}

function getNullableFormString(
  formData: FormData,
  name: string,
): string | null {
  const value = getFormString(formData, name).trim();
  return value || null;
}

function getNumber(formData: FormData, name: string): number | undefined {
  const value = getOptionalFormString(formData, name);

  if (!value) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getRequiredNumber(
  formData: FormData,
  name: string,
  message: string,
): number {
  const value = getNumber(formData, name);

  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

function getReceiptLinesFromAmounts(
  amounts: Record<string, string>,
  participants: Participant[],
): ReceiptLineDraft[] {
  return participants.flatMap((participant) => {
    const amount = parseReceiptAmountInput(amounts[participant.id] ?? "");

    return amount === null
      ? []
      : [
          {
            participantId: participant.id,
            participantName: participant.displayName,
            amount,
          },
        ];
  });
}

function getPaymentSplitsFromAmounts(
  amounts: Record<PaymentMethod, string>,
): CreateReceiptPaymentSplitPayload[] {
  return paymentMethods.flatMap((paymentMethod) => {
    const amount = parseReceiptAmountInput(amounts[paymentMethod] ?? "");

    return amount === null
      ? []
      : [
          {
            paymentMethod,
            amount,
          },
        ];
  });
}

function buildReceiptPayload({
  customerLabel,
  memo,
  paymentMethod,
  paymentSplits,
  saleLines,
  soldAt,
}: {
  customerLabel?: string;
  memo?: string;
  paymentMethod: PaymentMethod | "";
  paymentSplits?: CreateReceiptPaymentSplitPayload[];
  saleLines: ReceiptLineDraft[];
  soldAt?: string;
}): CreateReceiptPayload {
  if (saleLines.length === 0) {
    throw new Error("부스별 구매 금액을 하나 이상 입력해주세요.");
  }

  const totalAmount = saleLines.reduce(
    (sum, saleLine) => sum + saleLine.amount,
    0,
  );

  const receiptPaymentSplits =
    paymentSplits && paymentSplits.length > 0
      ? paymentSplits
      : [
          {
            paymentMethod: paymentMethod || "cash",
            amount: totalAmount,
          },
        ];
  const paymentTotal = receiptPaymentSplits.reduce(
    (sum, paymentSplit) => sum + paymentSplit.amount,
    0,
  );

  if (paymentTotal !== totalAmount) {
    throw new Error("결제 금액 합계가 종합 금액과 같아야 합니다.");
  }

  return {
    customerLabel,
    memo,
    paymentSplits: receiptPaymentSplits,
    saleLines: saleLines.map((saleLine) => ({
      participantId: saleLine.participantId,
      items: [
        {
          itemName: `${saleLine.participantName} 구매`,
          quantity: 1,
          unitPriceAmount: saleLine.amount,
        },
      ],
    })),
    soldAt,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === "undefined") {
    return;
  }

  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
}
