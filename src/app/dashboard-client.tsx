"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Pencil,
  Plus,
  X,
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
  SettlementDefaultSettings,
  SettlementFeeSettings,
  UpdateSettlementFeeSettingsPayload,
} from "@/services/settlement-settings.service";
import {
  useDashboardDialogStore,
  type MarketDialogMode,
  type ParticipantDialogMode,
  type ParticipantMasterDialogMode,
} from "@/stores/dashboard-dialog.store";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import {
  DashboardShell,
  type DashboardView,
} from "@/features/dashboard/components/dashboard-shell";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { FeeStatusView } from "@/features/fees/components/fee-status-view";
import {
  defaultFeeSettings,
  feeSettingScopeLabels,
  getParticipantFeeSettingsDefaults,
  type FeeSettingScope,
} from "@/features/fees/lib/fee-policy";
import { ParticipantList } from "@/features/participants/components/participant-list";
import { ParticipantMasterTable } from "@/features/participants/components/participant-master-table";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
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
  appShellClass,
  buttonVariants,
  inputClass,
  pageShellClass,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
  selectClass,
} from "@/lib/design-system";
import {
  formatDate,
  formatDateRange,
  formatMarketDuration,
} from "@/lib/date-format";
import { formatWon } from "@/lib/money";
import {
  parseReceiptAmountInput,
  paymentMethods,
} from "@/lib/receipt-matrix";

const marketStatusLabels: Record<MarketStatus, string> = {
  draft: "예정",
  active: "진행중",
  closed: "종료",
  archived: "보관",
};

type MarketLifecycleFilter = "all" | "upcoming" | "active" | "ended";
type ToastState = {
  id: number;
  message: string;
  title: string;
};

const marketLifecycleFilters: Array<{
  label: string;
  value: MarketLifecycleFilter;
}> = [
  { label: "전체", value: "all" },
  { label: "예정", value: "upcoming" },
  { label: "진행중", value: "active" },
  { label: "종료", value: "ended" },
];

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
  const [requestedParticipantId, setRequestedParticipantId] = useState<
    string | null
  >(null);
  const resetMatrixReceiptDraft = useReceiptMatrixStore(
    (state) => state.resetReceiptDraft,
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
  const [marketLifecycleFilter, setMarketLifecycleFilter] =
    useState<MarketLifecycleFilter>("active");
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
        <Toast
          toast={toast}
          onDismiss={() => {
            setToast(null);
          }}
        />
    </DashboardShell>
  );
}

function PageStateMessage({ message }: { message: string }) {
  return (
    <main className={pageShellClass}>
      <div className={appShellClass}>
        <section className={panelVariants()}>
          <div className="px-4 py-12 text-center text-sm text-zinc-500">
            {message}
          </div>
        </section>
      </div>
    </main>
  );
}

function Toast({
  onDismiss,
  toast,
}: {
  onDismiss: () => void;
  toast: ToastState | null;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm"
      role="status"
    >
      <div className="flex items-start gap-3 rounded-md border border-emerald-700 bg-zinc-950 px-4 py-3 text-white shadow-lg">
        <CheckCircle2
          aria-hidden
          className="mt-0.5 h-5 w-5 flex-none text-emerald-300"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm text-zinc-200">{toast.message}</p>
        </div>
        <button
          aria-label="토스트 닫기"
          className="rounded p-1 text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function HomeActionCard({
  description,
  href,
  label,
}: {
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="group flex min-h-[180px] flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      href={href}
    >
      <div>
        <p className="text-xs font-semibold text-emerald-700">업무 선택</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-950">{label}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <span className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-800 transition group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
        열기
      </span>
    </Link>
  );
}

function ParticipantMasterDialog({
  editingParticipant,
  isSubmitting,
  message,
  mode,
  onClose,
  onCreateSubmit,
  onUpdateSubmit,
}: {
  editingParticipant: Participant | null;
  isSubmitting: boolean;
  message: string | null;
  mode: ParticipantMasterDialogMode;
  onClose: () => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isCreateMode = mode === "create";
  const title = isCreateMode ? "부스 추가" : "부스 관리";
  const submitLabel = isCreateMode ? "추가" : "저장";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
      <section
        aria-labelledby="participant-master-dialog-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div>
            <h2
              className="text-base font-semibold text-zinc-950"
              id="participant-master-dialog-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              부스 기본 정보와 연락처
            </p>
          </div>
          <button
            aria-label="닫기"
            className={buttonVariants({ intent: "quiet", size: "sm" })}
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <form
          className="grid gap-4 p-4"
          data-testid="participant-master-form"
          key={`${mode}-${editingParticipant?.id ?? "new"}`}
          onSubmit={isCreateMode ? onCreateSubmit : onUpdateSubmit}
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              부스명
              <input
                className={inputClass}
                defaultValue={editingParticipant?.displayName ?? ""}
                disabled={isSubmitting}
                name="displayName"
                placeholder="부스명"
                required
                type="text"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              유형
              <select
                className={selectClass}
                defaultValue={editingParticipant?.participantType ?? "seller"}
                disabled={isSubmitting}
                name="participantType"
              >
                <option value="seller">셀러</option>
                <option value="staff">운영진</option>
                <option value="special_booth">특수 부스</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              담당자
              <input
                className={inputClass}
                defaultValue={editingParticipant?.contactName ?? ""}
                disabled={isSubmitting}
                name="contactName"
                placeholder="담당자"
                type="text"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              연락처
              <input
                className={inputClass}
                defaultValue={editingParticipant?.phone ?? ""}
                disabled={isSubmitting}
                name="phone"
                placeholder="010-0000-0000"
                type="tel"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600 sm:col-span-2">
              이메일
              <input
                className={inputClass}
                defaultValue={editingParticipant?.email ?? ""}
                disabled={isSubmitting}
                name="email"
                placeholder="email@example.com"
                type="email"
              />
            </label>
          </div>
          {!isCreateMode && (
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              상태
              <select
                className={selectClass}
                defaultValue={editingParticipant?.status ?? "active"}
                disabled={isSubmitting || !editingParticipant}
                name="status"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </label>
          )}
          <label className="grid gap-1 text-xs font-medium text-zinc-600">
            메모
            <textarea
              className={cn(inputClass, "min-h-24 resize-none py-2")}
              defaultValue={editingParticipant?.memo ?? ""}
              disabled={isSubmitting}
              name="memo"
              placeholder="메모"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              부스 기본 정보는 플리마켓 참가 설정에서 다시 연결해 사용합니다.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={buttonVariants({ intent: "secondary" })}
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
              >
                취소
              </button>
              <button
                className={buttonVariants()}
                disabled={isSubmitting || (!isCreateMode && !editingParticipant)}
                type="submit"
              >
                {isSubmitting ? "저장 중" : submitLabel}
              </button>
            </div>
          </div>
          {message && (
            <p className="text-sm font-medium text-red-700">{message}</p>
          )}
        </form>
      </section>
    </div>
  );
}

function FeeSettingsForm({
  defaultValues,
  disabled,
  message,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: SettlementDefaultSettings | null;
  disabled: boolean;
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
}) {
  return (
    <form
      className="grid gap-3 p-4"
      key={defaultValues?.updatedAt ?? defaultValues?.id ?? "empty"}
      onSubmit={onSubmit}
    >
      <FeeSettingsFields defaultValues={defaultValues ?? null} disabled={disabled} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          우선순위: 현재 플리마켓의 부스별 예외값, 플리마켓별 설정,
          전체 설정
        </p>
        <button className={buttonVariants()} disabled={disabled} type="submit">
          {submitLabel}
        </button>
      </div>
      {message && <p className="text-sm font-medium text-red-700">{message}</p>}
    </form>
  );
}

function FeeSettingsFields({
  allowInheritance = false,
  defaultValues,
  disabled,
  inheritanceScope = "market",
}: {
  allowInheritance?: boolean;
  defaultValues: Partial<SettlementFeeSettings> | null;
  disabled: boolean;
  inheritanceScope?: FeeSettingScope;
}) {
  const inheritanceLabel = `${feeSettingScopeLabels[inheritanceScope]} 사용`;

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        판매 수수료 %
        <input
          className={inputClass}
          defaultValue={formatRateInput(defaultValues?.salesCommissionRate)}
          disabled={disabled}
          min="0"
          name="salesCommissionPercent"
          placeholder={allowInheritance ? inheritanceLabel : "0"}
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        카드 수수료 %
        <input
          className={inputClass}
          defaultValue={formatRateInput(defaultValues?.cardFeeRate)}
          disabled={disabled}
          min="0"
          name="cardFeePercent"
          placeholder={allowInheritance ? inheritanceLabel : "0"}
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        카드 수수료 부담
        <select
          className={selectClass}
          defaultValue={defaultValues?.cardFeePayer ?? ""}
          disabled={disabled}
          name="cardFeePayer"
        >
          {allowInheritance && <option value="">{inheritanceLabel}</option>}
          <option value="market">마켓 부담</option>
          <option value="participant">참가부스 부담</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        참가비
        <input
          className={inputClass}
          defaultValue={
            defaultValues?.participationFeeAmount === undefined ||
            defaultValues.participationFeeAmount === null
              ? ""
              : String(defaultValues.participationFeeAmount)
          }
          disabled={disabled}
          min="0"
          name="participationFeeAmount"
          placeholder={allowInheritance ? inheritanceLabel : "0"}
          step="1"
          type="number"
        />
      </label>
    </div>
  );
}

function ParticipantDialog({
  editingParticipant,
  feeOverrideEnabled,
  isSubmitting,
  marketName,
  message,
  mode,
  onClose,
  onCreateSubmit,
  onFeeOverrideChange,
  onUpdateSubmit,
  unlinkedParticipants,
}: {
  editingParticipant: Participant | null;
  feeOverrideEnabled: boolean;
  isSubmitting: boolean;
  marketName: string;
  message: string | null;
  mode: ParticipantDialogMode;
  onClose: () => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFeeOverrideChange: (enabled: boolean) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  unlinkedParticipants: Participant[];
}) {
  const isCreateMode = mode === "create";
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const title = isCreateMode
    ? "참가부스 추가"
    : "이 플리마켓 참가 설정 수정";
  const submitLabel = isCreateMode ? "마켓에 연결" : "설정 저장";
  const selectedParticipant = isCreateMode
    ? (unlinkedParticipants.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null)
    : editingParticipant;
  const settlementControlsDisabled =
    isSubmitting || (isCreateMode && !selectedParticipant);
  const feeSettingsDefaults = isCreateMode
    ? defaultFeeSettings
    : getParticipantFeeSettingsDefaults(editingParticipant);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
      <section
        aria-labelledby="participant-dialog-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div>
            <h2
              className="text-base font-semibold text-zinc-950"
              id="participant-dialog-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{marketName}</p>
          </div>
          <button
            aria-label="닫기"
            className={buttonVariants({ intent: "quiet", size: "sm" })}
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <form
          className="grid gap-4 p-4"
          data-testid="participant-form"
          key={`${mode}-${editingParticipant?.id ?? "new"}`}
          onSubmit={isCreateMode ? onCreateSubmit : onUpdateSubmit}
        >
          {isCreateMode ? (
            <div className="grid gap-3">
              <input
                name="participantId"
                type="hidden"
                value={selectedParticipantId}
              />
              <ParticipantPicker
                disabled={isSubmitting}
                participants={unlinkedParticipants}
                search={participantSearch}
                selectedParticipantId={selectedParticipantId}
                onSearchChange={setParticipantSearch}
                onSelectParticipant={setSelectedParticipantId}
              />
            </div>
          ) : (
            <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_180px]">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs font-medium text-zinc-500">참가부스</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">
                  {editingParticipant?.displayName ?? "선택된 참가부스 없음"}
                </p>
              </div>
              <ParticipantTypeSelect
                defaultValue={editingParticipant?.participantType ?? "seller"}
                disabled={isSubmitting || !editingParticipant}
              />
            </div>
          )}
          {selectedParticipant ? (
            <>
              {isCreateMode && (
                <div className="grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      선택된 참가부스
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-950">
                      {selectedParticipant.displayName}
                    </p>
                  </div>
                  <ParticipantTypeSelect
                    key={selectedParticipant.id}
                    defaultValue={selectedParticipant.participantType}
                    disabled={settlementControlsDisabled}
                  />
                </div>
              )}
              <label className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                <input
                  checked={feeOverrideEnabled}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
                  disabled={settlementControlsDisabled}
                  name="feeSettingOverrideEnabled"
                  onChange={(event) =>
                    onFeeOverrideChange(event.target.checked)
                  }
                  type="checkbox"
                />
                이 플리마켓에서만 부스별 수수료 예외 적용
              </label>
              <FeeSettingsFields
                defaultValues={feeSettingsDefaults}
                disabled={settlementControlsDisabled || !feeOverrideEnabled}
              />
            </>
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              참가부스를 선택하면 정산 설정을 입력할 수 있습니다.
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              체크하지 않으면 플리마켓 기본값, 전체 기본값 순으로 적용됩니다.
              체크한 값은 현재 플리마켓의 참가부스에만 저장됩니다.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={buttonVariants({ intent: "secondary" })}
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
              >
                취소
              </button>
              <button
                className={buttonVariants()}
                disabled={
                  isSubmitting ||
                  (isCreateMode && !selectedParticipant) ||
                  (!isCreateMode && !editingParticipant)
                }
                type="submit"
              >
                {isSubmitting ? "저장 중" : submitLabel}
              </button>
            </div>
          </div>
          {message && (
            <p className="text-sm font-medium text-red-700">{message}</p>
          )}
        </form>
      </section>
    </div>
  );
}

function ParticipantPicker({
  disabled,
  participants,
  search,
  selectedParticipantId,
  onSearchChange,
  onSelectParticipant,
}: {
  disabled: boolean;
  participants: Participant[];
  search: string;
  selectedParticipantId: string;
  onSearchChange: (search: string) => void;
  onSelectParticipant: (participantId: string) => void;
}) {
  const filteredParticipants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return participants;
    }

    return participants.filter((participant) => {
      const searchableText = [
        participant.displayName,
        participant.contactName,
        participant.phone,
        participant.email,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [participants, search]);

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        참가부스 검색
        <input
          className={inputClass}
          disabled={disabled || participants.length === 0}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          placeholder="부스명, 담당자, 연락처 검색"
          type="search"
          value={search}
        />
      </label>
      <div className="max-h-72 overflow-y-auto rounded-md border border-zinc-200 bg-white">
        {participants.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            연결 가능한 참가부스가 없습니다.
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredParticipants.map((participant) => {
              const isSelected = participant.id === selectedParticipantId;
              const secondaryText = [
                participant.contactName,
                participant.phone,
                participant.email,
              ]
                .filter((value): value is string => Boolean(value))
                .join(" · ");

              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "grid w-full gap-2 px-4 py-3 text-left transition hover:bg-emerald-50/60",
                    isSelected && "bg-emerald-50 ring-1 ring-inset ring-emerald-300",
                  )}
                  disabled={disabled}
                  key={participant.id}
                  onClick={() => onSelectParticipant(participant.id)}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-zinc-950">
                        {participant.displayName}
                      </span>
                      {secondaryText && (
                        <span className="mt-1 block truncate text-xs text-zinc-500">
                          {secondaryText}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                        isSelected
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600",
                      )}
                    >
                      {isSelected
                        ? "선택됨"
                        : participantTypeLabels[participant.participantType]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantTypeSelect({
  defaultValue,
  disabled,
}: {
  defaultValue: ParticipantType;
  disabled: boolean;
}) {
  return (
    <select
      className={selectClass}
      defaultValue={defaultValue}
      disabled={disabled}
      name="participantType"
    >
      <option value="seller">셀러</option>
      <option value="staff">운영진</option>
      <option value="special_booth">특수 부스</option>
    </select>
  );
}

function MarketDialog({
  editingMarket,
  isSubmitting,
  message,
  mode,
  onClose,
  onCreateSubmit,
  onUpdateSubmit,
}: {
  editingMarket: Market | null;
  isSubmitting: boolean;
  message: string | null;
  mode: MarketDialogMode;
  onClose: () => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditMode = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
      <div
        aria-modal="true"
        className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              {isEditMode ? "플리마켓 관리" : "플리마켓 추가"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isEditMode
                ? "플리마켓의 기본 정보와 진행 상태를 수정합니다."
                : "새로운 플리마켓 이벤트를 등록합니다."}
            </p>
          </div>
          <button
            aria-label="닫기"
            className={buttonVariants({ intent: "quiet", size: "sm" })}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
        {message && (
          <p className="border-b border-zinc-200 px-5 py-3 text-sm font-medium text-red-700">
            {message}
          </p>
        )}
        <form
          className="grid max-h-[calc(100vh-12rem)] gap-4 overflow-y-auto p-5"
          data-testid="market-form"
          onSubmit={isEditMode ? onUpdateSubmit : onCreateSubmit}
        >
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            마켓명
            <input
              className={inputClass}
              defaultValue={editingMarket?.name ?? ""}
              name="name"
              placeholder="마켓명"
              type="text"
            />
          </label>
          {isEditMode && (
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              상태
              <select
                className={selectClass}
                defaultValue={editingMarket?.status ?? "draft"}
                name="status"
              >
                {Object.entries(marketStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              시작일
              <input
                className={inputClass}
                defaultValue={editingMarket?.startsOn ?? ""}
                name="startsOn"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              종료일
              <input
                className={inputClass}
                defaultValue={editingMarket?.endsOn ?? ""}
                name="endsOn"
                type="date"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            메모
            <textarea
              className={cn(inputClass, "h-auto min-h-28 py-3")}
              defaultValue={editingMarket?.description ?? ""}
              name="description"
              placeholder="메모"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              className={buttonVariants({ intent: "secondary" })}
              onClick={onClose}
              type="button"
            >
              취소
            </button>
            <button
              className={buttonVariants()}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "저장 중" : isEditMode ? "저장" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarketDetailPanel({
  market,
}: {
  market: Market | null;
}) {
  if (!market) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        마켓 정보를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div className="p-4">
      <dl className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="text-xs font-medium text-zinc-500">마켓명</dt>
          <dd className="mt-1 text-sm font-semibold text-zinc-950">
            {market.name}
          </dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="text-xs font-medium text-zinc-500">상태</dt>
          <dd className="mt-1">
            <span
              className={cn(
                "rounded-md px-2 py-1 text-xs font-semibold",
                getMarketStatusBadgeClass(market.status),
              )}
            >
              {marketStatusLabels[market.status]}
            </span>
          </dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="text-xs font-medium text-zinc-500">기간</dt>
          <dd className="mt-1 text-sm font-semibold text-zinc-950">
            {formatDateRange(market.startsOn, market.endsOn)}
          </dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="text-xs font-medium text-zinc-500">진행일</dt>
          <dd className="mt-1 text-sm font-semibold text-zinc-950">
            {formatMarketDuration(market.startsOn, market.endsOn)}
          </dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="text-xs font-medium text-zinc-500">등록일</dt>
          <dd className="mt-1 text-sm font-semibold text-zinc-950">
            {formatDate(market.createdAt)}
          </dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:col-span-2 2xl:col-span-5">
          <dt className="text-xs font-medium text-zinc-500">메모</dt>
          <dd className="mt-1 text-sm font-medium text-zinc-800">
            {market.description || "-"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function MarketLifecycleFilterControl({
  onSelectFilter,
  selectedFilter,
}: {
  onSelectFilter: (filter: MarketLifecycleFilter) => void;
  selectedFilter: MarketLifecycleFilter;
}) {
  return (
    <div
      aria-label="플리마켓 상태 필터"
      className="inline-flex w-fit rounded-lg border border-zinc-200 bg-zinc-100 p-1"
      role="group"
    >
      {marketLifecycleFilters.map((filter) => {
        const isActive = selectedFilter === filter.value;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "h-9 rounded-md px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
              isActive
                ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200"
                : "text-zinc-500 hover:bg-white/70 hover:text-zinc-950",
            )}
            key={filter.value}
            onClick={() => onSelectFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

function MarketSelectionCards({
  emptyMessage = "등록된 마켓이 없습니다.",
  markets,
  selectedMarketId,
  onManageMarket,
  onSelectMarket,
}: {
  emptyMessage?: string;
  markets: Market[];
  selectedMarketId: string | null;
  onManageMarket?: (market: Market) => void;
  onSelectMarket: (marketId: string) => void;
}) {
  if (markets.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 border-t border-zinc-200">
      {markets.map((market) => {
        const isSelected = selectedMarketId === market.id;

        return (
          <article
            className={cn(
              "grid cursor-pointer gap-4 px-4 py-4 transition hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_auto] lg:items-center",
              isSelected && "bg-emerald-50",
            )}
            data-testid="receipt-market-row"
            key={market.id}
            onClick={() => onSelectMarket(market.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectMarket(market.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-emerald-700">
                  플리마켓
                </p>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-semibold",
                    getMarketStatusBadgeClass(market.status),
                  )}
                >
                  {marketStatusLabels[market.status]}
                </span>
              </div>
              <h3 className="mt-2 truncate text-lg font-semibold text-zinc-950">
                {market.name}
              </h3>
              <p className="mt-2 text-sm font-medium text-zinc-700">
                {formatDateRange(market.startsOn, market.endsOn)}
              </p>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-[120px_140px_minmax(0,1fr)]">
              <div>
                <dt className="text-xs font-medium text-zinc-500">진행일</dt>
                <dd className="mt-1 font-medium text-zinc-800">
                  {formatMarketDuration(market.startsOn, market.endsOn)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">등록일</dt>
                <dd className="mt-1 font-medium text-zinc-800">
                  {formatDate(market.createdAt)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-zinc-500">메모</dt>
                <dd className="mt-1 truncate text-zinc-700">
                  {market.description || "-"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {onManageMarket && (
                <button
                  className={buttonVariants({ intent: "secondary", size: "sm" })}
                  onClick={(event) => {
                    event.stopPropagation();
                    onManageMarket(market);
                  }}
                  type="button"
                >
                  <Pencil aria-hidden className="mr-1.5 h-3.5 w-3.5" />
                  정보 수정
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
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

function getMarketStatusBadgeClass(status: MarketStatus): string {
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

function formatRateInput(value: number | null | undefined): string {
  return value === null || value === undefined
    ? ""
    : String(Number((value * 100).toFixed(4)));
}
