"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Pencil,
  Plus,
} from "lucide-react";
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
  useUpdateGlobalSettlementSettings,
  useUpdateMarketSettlementSettings,
} from "@/hooks/use-settlement-settings";
import { ApiError } from "@/services/api-client";
import type { Market, MarketStatus } from "@/services/markets.service";
import type {
  CardFeePayer,
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
import type {
  UpdateSettlementFeeSettingsPayload,
} from "@/services/settlement-settings.service";
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
import { HomeActionCard } from "@/features/dashboard/components/home-action-card";
import { PageStateMessage } from "@/features/dashboard/components/page-state-message";
import { FeeSettingsForm } from "@/features/fees/components/fee-settings-form";
import { FeeStatusView } from "@/features/fees/components/fee-status-view";
import {
  ParticipantDialog,
  ParticipantMasterDialog,
} from "@/features/participants/components/participant-dialogs";
import { MarketDetailPanel } from "@/features/markets/components/market-detail-panel";
import { MarketDialog } from "@/features/markets/components/market-dialog";
import { MarketLifecycleFilterControl } from "@/features/markets/components/market-lifecycle-filter-control";
import { MarketSelectionCards } from "@/features/markets/components/market-selection-cards";
import {
  marketStatusLabels,
  type MarketLifecycleFilter,
} from "@/features/markets/lib/market-display";
import { ParticipantList } from "@/features/participants/components/participant-list";
import { ParticipantMasterTable } from "@/features/participants/components/participant-master-table";
import { ProductTable } from "@/features/products/components/product-table";
import { ReceiptLookupView } from "@/features/receipts/components/receipt-lookup-view";
import { SalesMatrixView } from "@/features/receipts/components/sales-matrix-view";
import {
  buildReceiptSoldAtFromDateTimeInput,
  getDefaultReceiptDateTimeInputValue,
} from "@/features/receipts/lib/receipt-date-time";
import { SettlementPreviewPanel } from "@/features/settlements/components/settlement-preview-panel";
import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { cn } from "@/lib/utils";
import {
  buttonVariants,
  inputClass,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
  selectClass,
} from "@/lib/design-system";
import { formatDateRange } from "@/lib/date-format";
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
  const [globalFeeSettingsMessage, setGlobalFeeSettingsMessage] = useState<
    string | null
  >(null);
  const [marketFeeSettingsMessage, setMarketFeeSettingsMessage] = useState<
    string | null
  >(null);
  const toastIdRef = useRef(0);
  const resetMatrixReceiptDraft = useReceiptMatrixStore(
    (state) => state.resetReceiptDraft,
  );
  const marketLifecycleFilter = useDashboardUiStore(
    (state) => state.marketLifecycleFilter,
  );
  const requestedParticipantId = useDashboardUiStore(
    (state) => state.requestedParticipantId,
  );
  const setMarketLifecycleFilter = useDashboardUiStore(
    (state) => state.setMarketLifecycleFilter,
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
  const updateGlobalFeeSettings = useUpdateGlobalSettlementSettings();
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
  const filteredMarkets = useMemo(
    () =>
      sortMarketsByNewest(
        filterMarketsByLifecycle(markets.data ?? [], marketLifecycleFilter),
      ),
    [marketLifecycleFilter, markets.data],
  );
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

  async function handleUpdateGlobalFeeSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setGlobalFeeSettingsMessage(null);

    try {
      await updateGlobalFeeSettings.mutateAsync(
        getFeeSettingsPayload(new FormData(event.currentTarget)),
      );
      showToast(
        "전체 수수료 저장 완료",
        "전체 수수료 기본값을 저장했습니다.",
      );
    } catch (error) {
      setGlobalFeeSettingsMessage(getErrorMessage(error));
    }
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
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <HomeActionCard
                description="플리마켓을 만들고 선택한 뒤 해당 마켓의 참가부스 연결, 영수증, 정산을 관리합니다."
                href="/markets"
                label="마켓 관리"
              />
              <HomeActionCard
                description="마켓에 연결하기 전의 부스 기본 정보와 연락처를 관리합니다."
                href="/booths"
                label="부스 관리"
              />
              <HomeActionCard
                description="전체 수수료 기본값처럼 모든 플리마켓에 적용되는 기본 정책을 관리합니다."
                href="/settings"
                label="설정"
              />
            </section>
          </>
        )}

        {view === "settings" && (
          <section className={panelVariants()}>
            <div className={sectionHeaderClass}>
              <h2 className={sectionTitleClass}>전체 수수료 기본 설정</h2>
              <p className={sectionDescriptionClass}>
                플리마켓별 설정이나 현재 플리마켓 안의 부스별 예외값이
                없으면 이 값이 적용됩니다.
              </p>
            </div>
            <FeeSettingsForm
              defaultValues={globalFeeSettings.data}
              disabled={
                globalFeeSettings.isLoading ||
                updateGlobalFeeSettings.isPending
              }
              message={globalFeeSettingsMessage}
              submitLabel={
                updateGlobalFeeSettings.isPending ? "저장 중" : "저장"
              }
              onSubmit={handleUpdateGlobalFeeSettings}
            />
          </section>
        )}

        {view === "management" && (
          <>
            {marketId ? (
              <section className={panelVariants()}>
                <div
                  className={cn(
                    sectionHeaderClass,
                    "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
                  )}
                >
                  <div>
                    <h2 className={sectionTitleClass}>마켓 정보</h2>
                    <p className={sectionDescriptionClass}>
                      선택한 플리마켓의 기본 정보를 확인합니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={buttonVariants({ intent: "secondary" })}
                      disabled={!selectedMarket}
                      onClick={() =>
                        selectedMarket && openEditMarketDialog(selectedMarket)
                      }
                      type="button"
                    >
                      <Pencil aria-hidden className="mr-2 h-4 w-4" />
                      정보 수정
                    </button>
                    <Link
                      className={buttonVariants({ intent: "secondary" })}
                      href="/markets"
                    >
                      마켓 선택
                    </Link>
                  </div>
                </div>
                {marketMessage && (
                  <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                    {marketMessage}
                  </p>
                )}
                <MarketDetailPanel market={selectedMarket} />
                <div className="border-t border-zinc-200">
                  <div className={sectionHeaderClass}>
                    <h2 className={sectionTitleClass}>
                      플리마켓 수수료 기본 설정
                    </h2>
                    <p className={sectionDescriptionClass}>
                      현재 플리마켓 안의 부스별 예외값이 없으면 이 값이 전체
                      설정보다 우선 적용됩니다.
                    </p>
                  </div>
                  <FeeSettingsForm
                    defaultValues={marketFeeSettings.data}
                    disabled={
                      marketFeeSettings.isLoading ||
                      updateMarketFeeSettings.isPending
                    }
                    message={marketFeeSettingsMessage}
                    submitLabel={
                      updateMarketFeeSettings.isPending ? "저장 중" : "저장"
                    }
                    onSubmit={handleUpdateMarketFeeSettings}
                  />
                </div>
              </section>
            ) : (
              <>
                <section className={panelVariants()}>
                  <div
                    className={cn(
                      sectionHeaderClass,
                      "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
                    )}
                  >
                    <div>
                      <h2 className={sectionTitleClass}>플리마켓 선택</h2>
                      <p className={sectionDescriptionClass}>
                        작업할 플리마켓을 먼저 선택합니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <MarketLifecycleFilterControl
                        selectedFilter={marketLifecycleFilter}
                        onSelectFilter={setMarketLifecycleFilter}
                      />
                      <button
                        className={buttonVariants()}
                        disabled={createMarket.isPending}
                        onClick={openCreateMarketDialog}
                        type="button"
                      >
                        <Plus aria-hidden className="mr-2 h-4 w-4" />
                        플리마켓 추가
                      </button>
                    </div>
                  </div>
                  {marketMessage && (
                    <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                      {marketMessage}
                    </p>
                  )}
                  <MarketSelectionCards
                    emptyMessage="조건에 맞는 플리마켓이 없습니다."
                    markets={filteredMarkets}
                    selectedMarketId={null}
                    onManageMarket={openEditMarketDialog}
                    onSelectMarket={(selectedId) =>
                      router.push(`/markets/${selectedId}/management`)
                    }
                  />
                </section>
              </>
            )}
          </>
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
          <section className={panelVariants()}>
            <div
              className={cn(
                sectionHeaderClass,
                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div>
                <h2 className={sectionTitleClass}>부스</h2>
                <p className={sectionDescriptionClass}>
                  플리마켓에 연결하기 전의 부스 기본 정보를 관리합니다.
                </p>
              </div>
              <button
                className={buttonVariants()}
                disabled={createParticipantMaster.isPending}
                onClick={openCreateParticipantMasterDialog}
                type="button"
              >
                <Plus aria-hidden className="mr-2 h-4 w-4" />
                부스 추가
              </button>
            </div>
            {participantMasterMessage && (
              <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                {participantMasterMessage}
              </p>
            )}
            <ParticipantMasterTable
              participants={participantMasters.data ?? []}
              showLinkStatus={false}
              onEditParticipant={openEditParticipantMasterDialog}
            />
            {participantMasterDialogMode && (
              <ParticipantMasterDialog
                editingParticipant={editingParticipantMaster}
                isSubmitting={
                  createParticipantMaster.isPending ||
                  updateParticipantMaster.isPending
                }
                message={participantMasterMessage}
                mode={participantMasterDialogMode}
                onClose={closeParticipantMasterDialog}
                onCreateSubmit={handleCreateParticipantMaster}
                onUpdateSubmit={handleUpdateParticipantMaster}
              />
            )}
          </section>
        )}

        {view === "booths" && (
          <>
            <section className={panelVariants()}>
              <div
                className={cn(
                  sectionHeaderClass,
                  "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
                )}
              >
	                <div>
	                  <h2 className={sectionTitleClass}>마켓 참가 설정</h2>
	                  <p className={sectionDescriptionClass}>
	                    {selectedMarket?.name ?? "마켓 미선택"}
	                  </p>
	                </div>
	                <div className="flex flex-wrap gap-2">
	                  <button
	                    className={buttonVariants()}
	                    disabled={
	                      !selectedMarket ||
	                      !unlinkedParticipantMasters.length ||
	                      createParticipant.isPending
	                    }
	                    onClick={openCreateParticipantDialog}
	                    type="button"
	                  >
	                    <Plus aria-hidden className="mr-2 h-4 w-4" />
	                    참가부스 추가
	                  </button>
	                </div>
	              </div>
                  {participantMessage && !participantDialogMode && (
                    <p className="border-t border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                      {participantMessage}
                    </p>
                  )}
	              <ParticipantList
                    deleteDisabled={deleteParticipantFromMarket.isPending}
	                emptyMessage="연결된 참가부스가 없습니다."
                    globalSettings={globalFeeSettings.data ?? null}
                    marketSettings={marketFeeSettings.data ?? null}
	                participants={participants.data ?? []}
                    onDeleteParticipant={handleDeleteParticipantFromMarket}
	                selectedParticipantId={selectedParticipantId}
	                onEditParticipant={openEditParticipantDialog}
	                onSelectParticipant={setRequestedParticipantId}
	              />
	            </section>
	            <section className={panelVariants()}>
              <div
                className={cn(
                  sectionHeaderClass,
                  "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
                )}
              >
                <div>
                  <h2 className={sectionTitleClass}>상품</h2>
                  <p className={sectionDescriptionClass}>
                    {selectedParticipant
                      ? `${selectedMarket?.name ?? "마켓"} / ${selectedParticipant.displayName}`
                      : "참가부스 미선택"}
                  </p>
                </div>
                <form
                  className="grid gap-2 xl:grid-cols-[200px_220px_160px_140px_auto]"
                  data-testid="product-form"
                  onSubmit={handleCreateProduct}
                >
                  <select
                    className={selectClass}
                    disabled={!participants.data?.length}
                    onChange={(event) =>
                      setRequestedParticipantId(event.target.value || null)
                    }
                    value={selectedParticipantId ?? ""}
                  >
                    <option value="">참가부스 선택</option>
                    {(participants.data ?? []).map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.displayName}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    disabled={!selectedParticipant}
                    name="name"
                    placeholder="상품명"
                    type="text"
                  />
                  <input
                    className={inputClass}
                    disabled={!selectedParticipant}
                    name="sku"
                    placeholder="SKU"
                    type="text"
                  />
                  <input
                    className={inputClass}
                    disabled={!selectedParticipant}
                    min="0"
                    name="priceAmount"
                    placeholder="가격"
                    step="1"
                    type="number"
                  />
                  <button
                    className={buttonVariants()}
                    disabled={!selectedParticipant || createProduct.isPending}
                    type="submit"
                  >
                    상품 추가
                  </button>
                </form>
              </div>
              {productMessage && (
                <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                  {productMessage}
                </p>
              )}
              <ProductTable
                products={products.data ?? []}
                onStatusChange={handleProductStatusChange}
              />
            </section>
          </>
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

function getPercentRate(formData: FormData, name: string): number | undefined {
  const value = getNumber(formData, name);
  return value === undefined ? undefined : value / 100;
}

function getFeeSettingsPayload(
  formData: FormData,
): UpdateSettlementFeeSettingsPayload {
  return {
    settlementType: "commission",
    salesCommissionRate: getPercentRate(formData, "salesCommissionPercent") ?? 0,
    cardFeeRate: getPercentRate(formData, "cardFeePercent") ?? 0,
    cardFeePayer: getFormString(formData, "cardFeePayer") as CardFeePayer,
    participationFeeAmount: getNumber(formData, "participationFeeAmount") ?? 0,
  };
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

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
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

function filterMarketsByLifecycle(
  markets: Market[],
  filter: MarketLifecycleFilter,
): Market[] {
  if (filter === "all") {
    return markets;
  }

  return markets.filter((market) => getMarketLifecycle(market.status) === filter);
}

function sortMarketsByNewest(markets: Market[]): Market[] {
  return [...markets].sort(
    (left, right) => getMarketSortTime(right) - getMarketSortTime(left),
  );
}

function getMarketSortTime(market: Market): number {
  const time = Date.parse(market.startsOn ?? market.endsOn ?? market.createdAt);

  return Number.isNaN(time) ? 0 : time;
}

function getMarketLifecycle(status: MarketStatus): Exclude<MarketLifecycleFilter, "all"> {
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
