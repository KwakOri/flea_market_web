"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode, UIEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
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
import type { Product, ProductStatus } from "@/services/products.service";
import type {
  CreateReceiptPayload,
  CreateReceiptPaymentSplitPayload,
  PaymentMethod,
  Receipt,
} from "@/services/receipts.service";
import type {
  SettlementDefaultSettings,
  SettlementFeeSettings,
  UpdateSettlementFeeSettingsPayload,
} from "@/services/settlement-settings.service";
import type {
  MarketSettlementPreview,
  ParticipantSettlementPreview,
  SettlementListItem,
  SettlementStatus,
} from "@/services/settlements.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import {
  DashboardShell,
  type DashboardView,
} from "@/features/dashboard/components/dashboard-shell";
import { cn } from "@/lib/utils";
import {
  appShellClass,
  buttonVariants,
  compactSelectClass,
  inputClass,
  pageShellClass,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
  selectClass,
} from "@/lib/design-system";
import { formatMoneyAmount } from "@/lib/money";
import {
  parseOptionalReceiptAmount,
  parseReceiptAmountInput,
  paymentMethods,
  sumReceiptAmounts,
} from "@/lib/receipt-matrix";

const marketStatusLabels: Record<MarketStatus, string> = {
  draft: "예정",
  active: "진행중",
  closed: "종료",
  archived: "보관",
};

const participantTypeLabels: Record<ParticipantType, string> = {
  staff: "운영진",
  seller: "셀러",
  special_booth: "특수 부스",
};

const productStatusLabels: Record<ProductStatus, string> = {
  active: "판매",
  inactive: "중지",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "현금",
  card: "카드",
  transfer: "계좌이체",
  other: "기타",
};

const paymentMethodIcons: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
  other: CircleDollarSign,
};

const cardFeePayerLabels: Record<CardFeePayer, string> = {
  market: "마켓 부담",
  participant: "참가부스 부담",
};

const settlementStatusLabels: Record<SettlementStatus, string> = {
  confirmed: "확정",
  superseded: "이전 회차",
  voided: "무효",
};

type FeeSettingFieldKey = keyof SettlementFeeSettings;
type FeeSettingScope = "global" | "market" | "booth";
type MarketLifecycleFilter = "all" | "upcoming" | "active" | "ended";
type MarketDialogMode = "create" | "edit";
type ParticipantDialogMode = "create" | "edit";
type ParticipantMasterDialogMode = "create" | "edit";
type ToastState = {
  id: number;
  message: string;
  title: string;
};

const feeSettingScopeLabels: Record<FeeSettingScope, string> = {
  global: "전체 설정",
  market: "플리마켓 설정",
  booth: "부스 설정",
};

const defaultFeeSettings: SettlementFeeSettings = {
  settlementType: "commission",
  salesCommissionRate: 0,
  cardFeeRate: 0,
  cardFeePayer: "market",
  participationFeeAmount: 0,
};

const feeSettingFields: Array<{
  key: FeeSettingFieldKey;
  label: string;
}> = [
  { key: "salesCommissionRate", label: "판매" },
  { key: "cardFeeRate", label: "카드" },
  { key: "cardFeePayer", label: "카드 부담" },
  { key: "participationFeeAmount", label: "참가비" },
];

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
  const matrixReceiptAmounts = useReceiptMatrixStore(
    (state) => state.receiptAmounts,
  );
  const matrixReceiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.receiptDateTimeDraft,
  );
  const matrixPaymentMode = useReceiptMatrixStore((state) => state.paymentMode);
  const matrixSinglePaymentMethod = useReceiptMatrixStore(
    (state) => state.singlePaymentMethod,
  );
  const matrixPaymentSplits = useReceiptMatrixStore(
    (state) => state.paymentSplits,
  );
  const handleMatrixReceiptAmountChange = useReceiptMatrixStore(
    (state) => state.setReceiptAmount,
  );
  const setMatrixReceiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.setReceiptDateTimeDraft,
  );
  const clearMatrixReceiptDateTimeDraft = useReceiptMatrixStore(
    (state) => state.clearReceiptDateTimeDraft,
  );
  const handleMatrixPaymentModeChange = useReceiptMatrixStore(
    (state) => state.setPaymentMode,
  );
  const setMatrixSinglePaymentMethod = useReceiptMatrixStore(
    (state) => state.setSinglePaymentMethod,
  );
  const handleMatrixPaymentSplitChange = useReceiptMatrixStore(
    (state) => state.setPaymentSplit,
  );
  const handleMatrixPaymentFillRemaining = useReceiptMatrixStore(
    (state) => state.fillPaymentSplitRemaining,
  );
  const resetMatrixReceiptDraft = useReceiptMatrixStore(
    (state) => state.resetReceiptDraft,
  );
  const [marketDialogMode, setMarketDialogMode] =
    useState<MarketDialogMode | null>(null);
  const [editingMarketId, setEditingMarketId] = useState<string | null>(null);
  const [participantFeeOverrideEnabled, setParticipantFeeOverrideEnabled] =
    useState(false);
  const [participantDialogMode, setParticipantDialogMode] =
    useState<ParticipantDialogMode | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<
    string | null
  >(null);
  const [participantMasterDialogMode, setParticipantMasterDialogMode] =
    useState<ParticipantMasterDialogMode | null>(null);
  const [editingParticipantMasterId, setEditingParticipantMasterId] = useState<
    string | null
  >(null);
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
  const matrixReceiptDateTimeEnabled =
    matrixReceiptDateTimeDraft?.marketId === selectedMarketId &&
    matrixReceiptDateTimeDraft.enabled;
  const matrixReceiptDateTimeValue =
    matrixReceiptDateTimeEnabled && matrixReceiptDateTimeDraft?.value
      ? matrixReceiptDateTimeDraft.value
      : getDefaultReceiptDateTimeInputValue(
          selectedMarket?.startsOn ?? null,
          selectedMarket?.endsOn ?? null,
        );
  const matrixReceiptTotal = sumReceiptAmounts(matrixReceiptAmounts);
  const matrixPaymentSplitTotal = sumReceiptAmounts(matrixPaymentSplits);
  const matrixPaymentRemaining = Math.max(
    matrixReceiptTotal - matrixPaymentSplitTotal,
    0,
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
    setEditingMarketId(null);
    setMarketDialogMode("create");
  }

  function openEditMarketDialog(market: Market) {
    setMarketMessage(null);
    setEditingMarketId(market.id);
    setMarketDialogMode("edit");
  }

  function closeMarketDialog() {
    setMarketDialogMode(null);
    setEditingMarketId(null);
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
    setEditingParticipantMasterId(null);
    setParticipantMasterDialogMode("create");
  }

  function openEditParticipantMasterDialog(participant: Participant) {
    setParticipantMasterMessage(null);
    setEditingParticipantMasterId(participant.id);
    setParticipantMasterDialogMode("edit");
  }

  function closeParticipantMasterDialog() {
    setParticipantMasterDialogMode(null);
    setEditingParticipantMasterId(null);
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
    setEditingParticipantId(null);
    setParticipantFeeOverrideEnabled(false);
    setParticipantDialogMode("create");
  }

  function openEditParticipantDialog(participant: Participant) {
    setParticipantMessage(null);
    setRequestedParticipantId(participant.id);
    setEditingParticipantId(participant.id);
    setParticipantFeeOverrideEnabled(
      participant.settings?.feeSettingOverrideEnabled === true,
    );
    setParticipantDialogMode("edit");
  }

  function closeParticipantDialog() {
    setParticipantDialogMode(null);
    setEditingParticipantId(null);
    setParticipantFeeOverrideEnabled(false);
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
      const soldAt = matrixReceiptDateTimeEnabled
        ? buildReceiptSoldAtFromDateTimeInput(
            matrixReceiptDateTimeValue,
            selectedMarket?.startsOn ?? null,
            selectedMarket?.endsOn ?? null,
          )
        : new Date().toISOString();
      const saleLines = getReceiptLinesFromAmounts(
        matrixReceiptAmounts,
        participants.data ?? [],
      );

      const receipt = await createReceipt.mutateAsync(
        buildReceiptPayload({
          customerLabel: getOptionalFormString(formData, "customerLabel"),
          memo: getOptionalFormString(formData, "memo"),
          paymentMethod:
            matrixPaymentMode === "single" ? matrixSinglePaymentMethod : "",
          paymentSplits:
            matrixPaymentMode === "split"
              ? getPaymentSplitsFromAmounts(matrixPaymentSplits)
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
          <div>
            <DashboardPageTitle
              subtitle="전체 → 플리마켓 → 부스 우선순위로 적용되는 정책입니다."
              title="수수료 정책 현황"
            />
            <div className="mb-[22px] flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ intent: "secondary" })}
                href="/settings"
              >
                전체 설정
              </Link>
              <Link
                className={buttonVariants({ intent: "secondary" })}
                href={`/markets/${marketId}/management`}
              >
                플리마켓 설정
              </Link>
            </div>
            <section className={panelVariants()}>
              <FeeApplicationMatrix
                globalSettings={globalFeeSettings.data ?? null}
                isLoading={
                  globalFeeSettings.isLoading ||
                  marketFeeSettings.isLoading ||
                  participants.isLoading
                }
                marketSettings={marketFeeSettings.data ?? null}
                participants={participants.data ?? []}
                onEditParticipant={openEditParticipantDialog}
              />
            </section>
          </div>
        )}

        {view === "salesMatrix" && (
          <div>
            <DashboardPageTitle
              eyebrow={selectedMarket?.name ?? "마켓 미선택"}
              subtitle="한 결제 묶음에서 여러 부스 판매 라인을 한 번에 기록합니다."
              title="영수증 입력"
            />
            <form
              className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
              data-testid="receipt-matrix-form"
              onSubmit={handleCreateMatrixReceipt}
            >
              <section className="overflow-hidden rounded-[18px] border border-[#e6e2d4] bg-white shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
                <div className="grid gap-4 border-b border-dashed border-[#e0dbca] bg-[#fcfbf6] px-6 py-5 md:grid-cols-[minmax(180px,0.75fr)_minmax(180px,0.75fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.06em] text-[#8a8775]">
                      판매 시각
                    </div>
                    {matrixReceiptDateTimeEnabled ? (
                      <div className="grid gap-2">
                        <input
                          className={inputClass}
                          disabled={!selectedMarket}
                          id="receipt-sold-at"
                          max={getReceiptDateTimeMax(
                            selectedMarket?.endsOn ?? null,
                          )}
                          min={getReceiptDateTimeMin(
                            selectedMarket?.startsOn ?? null,
                          )}
                          onChange={(event) =>
                            setMatrixReceiptDateTimeDraft({
                              enabled: true,
                              marketId: selectedMarketId,
                              value: event.target.value,
                            })
                          }
                          required
                          type="datetime-local"
                          value={matrixReceiptDateTimeValue}
                        />
                        <button
                          className={cn(
                            buttonVariants({ intent: "secondary", size: "sm" }),
                            "w-fit",
                          )}
                          onClick={() => {
                            clearMatrixReceiptDateTimeDraft();
                          }}
                          type="button"
                        >
                          현재 시간 사용
                        </button>
                      </div>
                    ) : (
                      <button
                        className={buttonVariants({ intent: "secondary" })}
                        disabled={!selectedMarket}
                        onClick={() => {
                          setMatrixReceiptDateTimeDraft({
                            enabled: true,
                            marketId: selectedMarketId,
                            value: getDefaultReceiptDateTimeInputValue(
                              selectedMarket?.startsOn ?? null,
                              selectedMarket?.endsOn ?? null,
                            ),
                          });
                        }}
                        type="button"
                      >
                        날짜 직접 설정
                      </button>
                    )}
                  </div>
                  <label className="min-w-0">
                    <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.06em] text-[#8a8775]">
                      구매자
                    </span>
                    <input
                      className={inputClass}
                      disabled={!participants.data?.length}
                      name="customerLabel"
                      placeholder="현장 고객"
                      type="text"
                    />
                  </label>
                  <label className="min-w-0">
                    <span className="mb-1.5 block font-mono text-[10.5px] tracking-[0.06em] text-[#8a8775]">
                      메모
                    </span>
                    <input
                      className={inputClass}
                      disabled={!participants.data?.length}
                      name="memo"
                      placeholder="묶음 결제 · 요청사항"
                      type="text"
                    />
                  </label>
                </div>

                {receiptMessage && (
                  <p className="border-b border-[#f1eee2] px-6 py-3 text-sm font-semibold text-[#cf3d3d]">
                    {receiptMessage}
                  </p>
                )}

                <ReceiptMatrixInputTable
                  amounts={matrixReceiptAmounts}
                  onAmountChange={handleMatrixReceiptAmountChange}
                  participants={participants.data ?? []}
                />

                <div className="grid gap-px border-t border-[#e6e2d4] bg-[#e6e2d4] md:grid-cols-3">
                  <ReceiptTotalCell
                    label="종합 금액"
                    testId="receipt-matrix-total"
                    value={formatWon(matrixReceiptTotal)}
                  />
                  <ReceiptTotalCell
                    label="결제 입력"
                    value={formatWon(
                      matrixPaymentMode === "split"
                        ? matrixPaymentSplitTotal
                        : matrixReceiptTotal,
                    )}
                  />
                  <ReceiptTotalCell
                    accent
                    label="남은 금액"
                    testId="receipt-matrix-payment-remaining"
                    value={formatWon(
                      matrixPaymentMode === "split"
                        ? matrixPaymentRemaining
                        : 0,
                    )}
                  />
                </div>
              </section>

              <aside className="grid gap-5">
                <section className="rounded-[18px] border border-[#e6e2d4] bg-white p-5 shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
                  <div className="mb-3.5 flex items-center justify-between gap-3">
                    <h3 className="font-display text-[15px] font-bold">
                      결제수단 분할
                    </h3>
                    <div className="inline-flex rounded-[9px] bg-[#f1eee2] p-[3px]">
                      <button
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-bold transition",
                          matrixPaymentMode === "single"
                            ? "bg-[#c7f94b] text-[#16170f]"
                            : "text-[#8a8775]",
                        )}
                        onClick={() =>
                          handleMatrixPaymentModeChange("single")
                        }
                        type="button"
                      >
                        단일
                      </button>
                      <button
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-bold transition",
                          matrixPaymentMode === "split"
                            ? "bg-[#c7f94b] text-[#16170f]"
                            : "text-[#8a8775]",
                        )}
                        onClick={() => handleMatrixPaymentModeChange("split")}
                        type="button"
                      >
                        분할
                      </button>
                    </div>
                  </div>

                  {matrixPaymentMode === "single" ? (
                    <div className="grid gap-2">
                      {paymentMethods.map((paymentMethod) => {
                        const Icon = paymentMethodIcons[paymentMethod];
                        const isActive =
                          matrixSinglePaymentMethod === paymentMethod;

                        return (
                          <button
                            className={cn(
                              "flex items-center gap-2.5 rounded-[11px] border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                              isActive
                                ? "border-[#bfe3cd] bg-[#e6f4ec] text-[#1f6e40]"
                                : "border-[#eee9da] bg-[#fcfbf6] text-[#8a8775] hover:bg-[#f1eee2]",
                            )}
                            disabled={!participants.data?.length}
                            key={paymentMethod}
                            onClick={() =>
                              setMatrixSinglePaymentMethod(paymentMethod)
                            }
                            type="button"
                          >
                            <Icon aria-hidden className="h-4 w-4 flex-none" />
                            <span className="flex-1">
                              {paymentMethodLabels[paymentMethod]}
                            </span>
                            <span className="font-display text-[15px] font-bold">
                              {isActive ? formatWon(matrixReceiptTotal) : "0원"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {paymentMethods.map((paymentMethod) => {
                        const Icon = paymentMethodIcons[paymentMethod];

                        return (
                          <div
                            className="grid gap-2 rounded-[11px] border border-[#eee9da] bg-[#fcfbf6] p-3"
                            key={paymentMethod}
                          >
                            <label
                              className="flex items-center gap-2 text-sm font-semibold text-[#56564a]"
                              htmlFor={`matrix-payment-${paymentMethod}`}
                            >
                              <Icon
                                aria-hidden="true"
                                className="h-4 w-4 text-[#8a8775]"
                              />
                              {paymentMethodLabels[paymentMethod]}
                            </label>
                            <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-2">
                              <input
                                className={cn(inputClass, "text-right")}
                                disabled={
                                  !participants.data?.length ||
                                  matrixReceiptTotal <= 0
                                }
                                id={`matrix-payment-${paymentMethod}`}
                                inputMode="numeric"
                                onChange={(event) =>
                                  handleMatrixPaymentSplitChange(
                                    paymentMethod,
                                    event.target.value,
                                  )
                                }
                                placeholder="0"
                                type="text"
                                value={matrixPaymentSplits[paymentMethod]}
                              />
                              <button
                                className={cn(
                                  buttonVariants({
                                    intent: "secondary",
                                    size: "sm",
                                  }),
                                  "h-10 min-w-16 whitespace-nowrap px-3 text-sm",
                                )}
                                disabled={
                                  !participants.data?.length ||
                                  matrixReceiptTotal <= 0
                                }
                                onClick={() =>
                                  handleMatrixPaymentFillRemaining(
                                    paymentMethod,
                                  )
                                }
                                type="button"
                              >
                                잔액
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-[18px] bg-[#16170f] p-[22px] text-[#f3f0e2]">
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full",
                        matrixPaymentMode === "split" &&
                          matrixPaymentRemaining !== 0
                          ? "bg-[#c47d12]"
                          : "bg-[#1f8a4d]",
                      )}
                    >
                      <CheckCircle2 aria-hidden className="h-[18px] w-[18px]" strokeWidth={3} />
                    </span>
                    <div>
                      <div className="font-display text-base font-bold">
                        {matrixPaymentMode === "split" &&
                        matrixPaymentRemaining !== 0
                          ? "검증 대기"
                          : "검증 완료"}
                      </div>
                      <div className="font-mono text-[10.5px] tracking-[0.04em] text-[#8d8c79]">
                        입력 합계 = 결제 합계
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between border-t border-[#2c2d22] py-1.5 text-[12.5px]">
                    <span className="text-[#9b9a86]">남은 금액</span>
                    <span className="font-display font-bold text-[#c7f94b]">
                      {formatWon(
                        matrixPaymentMode === "split"
                          ? matrixPaymentRemaining
                          : 0,
                      )}
                    </span>
                  </div>
                  <button
                    className="mt-3.5 w-full rounded-xl border-0 bg-[#c7f94b] p-3 text-[15px] font-bold text-[#16170f] transition hover:bg-[#d4ff5e] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      !participants.data?.length ||
                      createReceipt.isPending ||
                      matrixReceiptTotal <= 0 ||
                      (matrixPaymentMode === "split" &&
                        matrixPaymentRemaining !== 0)
                    }
                    type="submit"
                  >
                    영수증 저장
                  </button>
                </section>
              </aside>
            </form>
          </div>
        )}

        {view === "receiptLookup" && (
          <div>
            <DashboardPageTitle
              eyebrow={formatDateRange(
                selectedMarket?.startsOn ?? null,
                selectedMarket?.endsOn ?? null,
              )}
              subtitle="행과 부스별 기여 금액을 한 화면에서 비교합니다."
              title="영수증 조회"
            />
            <section className={panelVariants()}>
                {participants.isLoading || receipts.isLoading ? (
                  <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
                    영수증을 불러오는 중입니다.
                  </div>
                ) : (
                  <ReceiptMatrixTable
                    participants={participants.data ?? []}
                    receipts={receipts.data ?? []}
                  />
                )}
            </section>
          </div>
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

function DashboardPageTitle({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="mb-[22px] flex flex-wrap items-baseline gap-3.5">
      <h2 className="m-0 font-display text-[30px] font-bold tracking-[-0.025em] text-[#1a1b12]">
        {title}
      </h2>
      {subtitle ? (
        <span className="font-mono text-xs text-[#8a8775]">{subtitle}</span>
      ) : null}
      {eyebrow ? (
        <span className="font-mono text-[11px] text-[#a8a593]">{eyebrow}</span>
      ) : null}
    </div>
  );
}

function ReceiptTotalCell({
  accent = false,
  label,
  testId,
  value,
}: {
  accent?: boolean;
  label: string;
  testId?: string;
  value: string;
}) {
  return (
    <div
      className={cn("px-6 py-4", accent ? "bg-[#e6f4ec]" : "bg-[#fcfbf6]")}
      data-testid={testId}
    >
      <div
        className={cn(
          "font-mono text-[10.5px] tracking-[0.06em]",
          accent ? "text-[#1f8a4d]" : "text-[#8a8775]",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-[22px] font-bold",
          accent ? "text-[#1f8a4d]" : "text-[#1a1b12]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ParticipantTypeBadge({ type }: { type: ParticipantType }) {
  const classNameByType: Record<ParticipantType, string> = {
    seller: "bg-[#f1eee2] text-[#8a8775]",
    staff: "bg-[#26271c] text-[#d7d3bf]",
    special_booth: "bg-[#eef9d4] text-[#5c7a16]",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-1 font-mono text-[10.5px] font-semibold",
        classNameByType[type],
      )}
    >
      {participantTypeLabels[type]}
    </span>
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

function FeeApplicationMatrix({
  globalSettings,
  isLoading,
  marketSettings,
  onEditParticipant,
  participants,
}: {
  globalSettings: SettlementDefaultSettings | null;
  isLoading: boolean;
  marketSettings: SettlementDefaultSettings | null;
  onEditParticipant: (participant: Participant) => void;
  participants: Participant[];
}) {
  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
        수수료 적용 현황을 불러오는 중입니다.
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
        연결된 참가부스가 없습니다.
      </div>
    );
  }

  const resolvedGlobalSettings = globalSettings ?? {
    ...defaultFeeSettings,
    id: null,
    scope: "global" as const,
    marketId: null,
    createdBy: null,
    createdAt: null,
    updatedAt: null,
  };
  const hasMarketSettings = Boolean(marketSettings?.id);

  return (
    <div className="overflow-hidden rounded-[18px] bg-white">
      <div className="min-w-0 max-w-full overflow-x-auto">
        <div className="min-w-[1120px]">
          <div className="grid grid-cols-[170px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(260px,1fr)] bg-[#16170f] px-[22px] py-[13px] font-mono text-[10.5px] font-semibold tracking-[0.06em] text-[#9b9a86]">
            <span>참가 부스</span>
            <span>전체 기본값</span>
            <span>플리마켓 기본값</span>
            <span className="text-[#c7f94b]">이 부스 설정</span>
          </div>
          <div className="divide-y divide-[#f1eee2]">
            {participants.map((participant) => {
              const activeScope = getParticipantFeePolicySource(
                participant,
                hasMarketSettings,
              );
              const hasBoothSettings =
                participant.settings?.feeSettingOverrideEnabled === true;

              return (
                <div
                  className="grid grid-cols-[170px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(260px,1fr)] items-stretch gap-3.5 px-[22px] py-4"
                  data-testid="fee-status-row"
                  key={participant.id}
                >
                  <div className="pt-1">
                    <p className="text-[14.5px] font-semibold text-[#1a1b12]">
                      {participant.displayName}
                    </p>
                    <p className="mt-2">
                      <ParticipantTypeBadge
                        type={participant.participantType}
                      />
                    </p>
                  </div>
                  <FeeApplicationCell
                    isActive={activeScope === "global"}
                    scope="global"
                    settings={resolvedGlobalSettings}
                    title="전체 기본값"
                  />
                  <FeeApplicationCell
                    isActive={activeScope === "market"}
                    scope="market"
                    settings={hasMarketSettings ? marketSettings : null}
                    title={hasMarketSettings ? "플리마켓 기본값" : "미설정"}
                    unavailableMessage="플리마켓 설정이 없어 전체 설정을 사용합니다."
                  />
                  <FeeApplicationCell
                    action={
                      <button
                        aria-label={`${participant.displayName} 부스별 수수료 설정`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#d8d3c2] bg-white text-[#1a1b12] transition hover:bg-[#f1eee2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b]"
                        onClick={() => onEditParticipant(participant)}
                        title="부스별 수수료 설정"
                        type="button"
                      >
                        <CircleDollarSign aria-hidden className="h-3.5 w-3.5" />
                      </button>
                    }
                    fallbackScope={hasMarketSettings ? "market" : "global"}
                    isActive={activeScope === "booth"}
                    scope="booth"
                    settings={hasBoothSettings ? participant.settings : null}
                    title={hasBoothSettings ? "부스 설정" : "부스 설정 없음"}
                    unavailableMessage={`부스 설정이 없어 ${feeSettingScopeLabels[activeScope]}을 사용합니다.`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeeApplicationCell({
  action,
  fallbackScope,
  isActive,
  scope,
  settings,
  title,
  unavailableMessage,
}: {
  action?: ReactNode;
  fallbackScope?: FeeSettingScope;
  isActive: boolean;
  scope: FeeSettingScope;
  settings:
    | SettlementDefaultSettings
    | Participant["settings"]
    | null
    | undefined;
  title: string;
  unavailableMessage?: string;
}) {
  const isUnavailable = !settings;

  return (
    <div
      className={cn(
        "grid h-full min-h-[154px] content-start gap-2 rounded-xl border border-[#ece7d8] bg-white p-[13px] transition-opacity",
        isActive && "border-[#1f8a4d] bg-[#e6f4ec]",
        !isActive && "opacity-50 hover:opacity-75",
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-[#56564a]">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "font-mono text-[9.5px] font-bold",
              isActive
                ? "text-[#1f8a4d]"
                : isUnavailable
                  ? "text-[#bdb9a8]"
                  : "text-[#bdb9a8]",
            )}
          >
            {isActive ? "적용 중" : isUnavailable ? "미설정" : "대기"}
          </span>
          {action}
        </div>
      </div>
      {isUnavailable ? (
        <p className="grid min-h-[94px] place-items-center rounded-[10px] bg-[#fcfbf6] px-3 py-4 text-center text-sm leading-relaxed text-[#8a8775]">
          {unavailableMessage ?? "설정이 없습니다."}
        </p>
      ) : (
        <dl className="grid gap-1.5">
          {feeSettingFields.map((field) => {
            return (
              <div
                className={cn(
                  "grid min-h-7 grid-cols-[76px_minmax(0,1fr)_38px] items-center gap-2 rounded-md px-2 py-1",
                  isActive && "bg-white shadow-sm ring-1 ring-[#bfe3cd]",
                )}
                key={field.key}
              >
                <dt className="text-xs text-[#8a8775]">{field.label}</dt>
                <dd className="truncate font-display font-semibold text-[#1a1b12]">
                  {formatFeeFieldValue(
                    field.key,
                    getScopedFeeFieldValue(scope, settings, field.key),
                    fallbackScope,
                  )}
                </dd>
                <span
                  className={cn(
                    "text-right font-mono text-[11px] font-semibold",
                    isActive ? "text-[#1f8a4d]" : "text-[#c4c0ae]",
                  )}
                >
                  {isActive ? "적용" : "-"}
                </span>
              </div>
            );
          })}
        </dl>
      )}
    </div>
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

function ParticipantMasterTable({
  participants,
  linkedParticipantIds = new Set<string>(),
  onEditParticipant,
  showLinkStatus = true,
}: {
  participants: Participant[];
  linkedParticipantIds?: Set<string>;
  onEditParticipant?: (participant: Participant) => void;
  showLinkStatus?: boolean;
}) {
  if (participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 참가부스가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">부스명</th>
            <th className="px-4 py-3 font-medium">유형</th>
            <th className="px-4 py-3 font-medium">담당자</th>
            <th className="px-4 py-3 font-medium">연락처</th>
            <th className="px-4 py-3 font-medium">이메일</th>
            <th className="px-4 py-3 font-medium">상태</th>
            {showLinkStatus && (
              <th className="px-4 py-3 font-medium">선택 마켓</th>
            )}
            <th className="px-4 py-3 font-medium">메모</th>
            {onEditParticipant && (
              <th className="px-4 py-3 text-right font-medium">관리</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {participants.map((participant) => (
            <tr data-testid="participant-master-row" key={participant.id}>
              <td className="px-4 py-3 font-medium text-zinc-950">
                {participant.displayName}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {participantTypeLabels[participant.participantType]}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {participant.contactName ?? "-"}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {participant.phone ?? "-"}
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 text-zinc-700">
                {participant.email ?? "-"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    participant.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-100 text-zinc-500",
                  )}
                >
                  {participant.status === "active" ? "활성" : "비활성"}
                </span>
              </td>
              {showLinkStatus && (
                <td className="px-4 py-3">
                  {linkedParticipantIds.has(participant.id) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                      연결됨
                    </span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
              )}
              <td className="max-w-[260px] truncate px-4 py-3 text-zinc-600">
                {participant.memo ?? "-"}
              </td>
              {onEditParticipant && (
                <td className="px-4 py-3 text-right">
                  <button
                    className={buttonVariants({
                      intent: "secondary",
                      size: "sm",
                    })}
                    onClick={() => onEditParticipant(participant)}
                    type="button"
                  >
                    <Pencil aria-hidden className="mr-1.5 h-3.5 w-3.5" />
                    관리
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantList({
  deleteDisabled = false,
  globalSettings,
  marketSettings,
  participants,
  selectedParticipantId,
  onDeleteParticipant,
  onEditParticipant,
  onSelectParticipant,
  emptyMessage = "등록된 참가부스가 없습니다.",
}: {
  deleteDisabled?: boolean;
  globalSettings: SettlementDefaultSettings | null;
  marketSettings: SettlementDefaultSettings | null;
  participants: Participant[];
  selectedParticipantId: string | null;
  onDeleteParticipant?: (participant: Participant) => void;
  onEditParticipant: (participant: Participant) => void;
  onSelectParticipant: (participantId: string) => void;
  emptyMessage?: string;
}) {
  if (participants.length === 0) {
    return (
      <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-zinc-100 border-t border-zinc-200"
      data-testid="participant-list"
    >
      {participants.map((participant) => {
        const hasMarketSettings = Boolean(marketSettings?.id);
        const activeScope = getParticipantFeePolicySource(
          participant,
          hasMarketSettings,
        );

        return (
          <div
            className={cn(
              "grid gap-3 px-4 py-3 transition hover:bg-emerald-50/50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start",
              selectedParticipantId === participant.id && "bg-emerald-50",
            )}
            data-testid="participant-row"
            key={participant.id}
          >
            <button
              className="min-w-0 text-left"
              onClick={() => onSelectParticipant(participant.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-950">
                    {participant.displayName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {participantTypeLabels[participant.participantType]}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    activeScope === "booth"
                      ? "bg-amber-100 text-amber-800"
                      : activeScope === "market"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-zinc-100 text-zinc-600",
                  )}
                >
                  {feeSettingScopeLabels[activeScope]}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-zinc-500">카드 수수료</dt>
                  <dd className="mt-1 font-medium text-zinc-800">
                    {formatParticipantFeeFieldDisplay(
                      participant,
                      globalSettings,
                      marketSettings,
                      "cardFeeRate",
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">참가비</dt>
                  <dd className="mt-1 font-medium text-zinc-800">
                    {formatParticipantFeeFieldDisplay(
                      participant,
                      globalSettings,
                      marketSettings,
                      "participationFeeAmount",
                    )}
                  </dd>
                </div>
              </dl>
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                aria-label={`${participant.displayName} 수정`}
                className={cn(
                  buttonVariants({ intent: "secondary", size: "sm" }),
                  "h-10 w-10 px-0",
                )}
                onClick={() => onEditParticipant(participant)}
                title="수정"
                type="button"
              >
                <Pencil aria-hidden className="h-4 w-4" />
              </button>
              {onDeleteParticipant && (
                <button
                  aria-label={`${participant.displayName} 삭제`}
                  className={cn(
                    buttonVariants({ intent: "secondary", size: "sm" }),
                    "h-10 w-10 border-red-200 px-0 text-red-700 hover:bg-red-50",
                  )}
                  disabled={deleteDisabled}
                  onClick={() => onDeleteParticipant(participant)}
                  title="삭제"
                  type="button"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductTable({
  products,
  onStatusChange,
}: {
  products: Product[];
  onStatusChange: (productId: string, status: ProductStatus) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 상품이 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">상품명</th>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 text-right font-medium">가격</th>
            <th className="px-4 py-3 font-medium">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {products.map((product) => (
            <tr data-testid="product-row" key={product.id}>
              <td className="px-4 py-3 font-medium text-zinc-950">
                {product.name}
              </td>
              <td className="px-4 py-3 text-zinc-600">{product.sku ?? "-"}</td>
              <td className="px-4 py-3 text-right font-medium text-zinc-950">
                {formatWon(product.priceAmount)}
              </td>
              <td className="px-4 py-3">
                <select
                  className={compactSelectClass}
                  onChange={(event) =>
                    onStatusChange(
                      product.id,
                      event.target.value as ProductStatus,
                    )
                  }
                  value={product.status}
                >
                  {Object.entries(productStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptMatrixInputTable({
  amounts,
  onAmountChange,
  participants,
}: {
  amounts: Record<string, string>;
  onAmountChange: (participantId: string, amount: string) => void;
  participants: Participant[];
}) {
  if (participants.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-[#8a8775]">
        마켓에 연결된 참가부스가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_96px] bg-[#16170f] px-6 py-3">
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-[#9b9a86]">
            참가 부스
          </span>
          <span className="text-right font-mono text-[10.5px] tracking-[0.08em] text-[#9b9a86]">
            구매 금액
          </span>
          <span className="text-right font-mono text-[10.5px] tracking-[0.08em] text-[#9b9a86]">
            유형
          </span>
        </div>
        <div>
          {participants.map((participant) => {
            const hasAmount =
              (parseOptionalReceiptAmount(amounts[participant.id] ?? "") ?? 0) >
              0;

            return (
              <div
                className={cn(
                  "grid grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_96px] items-center border-b border-[#f1eee2] px-6 py-2.5",
                  hasAmount ? "bg-[#fcfdf7]" : "bg-white",
                )}
                key={participant.id}
              >
                <div
                  className={cn(
                    "text-[14.5px] font-semibold",
                    hasAmount ? "text-[#16170f]" : "text-[#56564a]",
                  )}
                >
                {participant.displayName}
                </div>
                <div className="flex justify-end">
                  <div
                    className={cn(
                      "flex w-[150px] items-center gap-1 rounded-[9px] border px-3 py-2",
                      hasAmount
                        ? "border-[#16170f] bg-[#f7fbe9]"
                        : "border-[#e6e2d4] bg-[#fcfbf6]",
                    )}
                  >
                    <input
                      className="min-w-0 flex-1 bg-transparent text-right font-display text-[15px] font-bold text-[#16170f] outline-none placeholder:text-[#c4c0ae]"
                      inputMode="numeric"
                      name={`amount-${participant.id}`}
                      onChange={(event) =>
                        onAmountChange(participant.id, event.target.value)
                      }
                      placeholder="0"
                      type="text"
                      value={amounts[participant.id] ?? ""}
                    />
                    <span className="text-xs text-[#a8a593]">원</span>
                  </div>
                </div>
                <div className="text-right">
                  <ParticipantTypeBadge type={participant.participantType} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReceiptMatrixTable({
  receipts,
  participants,
}: {
  receipts: Receipt[];
  participants: Participant[];
}) {
  const fixedBodyRef = useRef<HTMLDivElement>(null);
  const boothHeaderRef = useRef<HTMLDivElement>(null);
  const boothBodyRef = useRef<HTMLDivElement>(null);

  if (receipts.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
        등록된 영수증이 없습니다.
      </div>
    );
  }

  const boothGridTemplate = `repeat(${Math.max(
    participants.length,
    1,
  )}, minmax(132px, 132px))`;
  const fixedGridTemplate = "132px 132px 124px 220px 112px";

  function syncReceiptScroll(scrollTop: number, scrollLeft: number) {
    if (fixedBodyRef.current) {
      fixedBodyRef.current.scrollTop = scrollTop;
    }

    if (boothHeaderRef.current) {
      boothHeaderRef.current.scrollLeft = scrollLeft;
    }
  }

  function handleBoothBodyScroll(event: UIEvent<HTMLDivElement>) {
    syncReceiptScroll(
      event.currentTarget.scrollTop,
      event.currentTarget.scrollLeft,
    );
  }

  function handleFixedBodyScroll(event: UIEvent<HTMLDivElement>) {
    const boothBody = boothBodyRef.current;

    if (!boothBody) {
      return;
    }

    boothBody.scrollTop = event.currentTarget.scrollTop;
  }

  function handleBoothHeaderScroll(event: UIEvent<HTMLDivElement>) {
    const boothBody = boothBodyRef.current;

    if (!boothBody) {
      return;
    }

    boothBody.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <div className="grid h-[calc(100vh-260px)] min-h-[320px] min-w-[1040px] max-h-[720px] overflow-hidden grid-cols-[720px_minmax(0,1fr)] grid-rows-[72px_minmax(0,1fr)]">
        <div
          className="z-20 grid items-center border-b border-r border-[#2c2d22] bg-[#16170f] font-mono text-[10.5px] tracking-[0.06em] text-[#9b9a86]"
          style={{ gridTemplateColumns: fixedGridTemplate }}
        >
          <div className="px-4 text-center font-semibold">판매 시각</div>
          <div className="px-4 text-center font-semibold">영수증번호</div>
          <div className="px-4 text-center font-semibold">구매자</div>
          <div className="px-4 text-center font-semibold">결제</div>
          <div className="px-4 text-center font-semibold">합계</div>
        </div>

        <div
          className="scrollbar-hidden min-w-0 overflow-x-auto overflow-y-hidden border-b border-[#2c2d22] bg-[#16170f]"
          data-testid="receipt-booth-header"
          onScroll={handleBoothHeaderScroll}
          ref={boothHeaderRef}
        >
          {participants.length > 0 && (
            <div
              className="grid h-full min-w-max items-center font-mono text-[10.5px] tracking-[0.06em] text-[#9b9a86]"
              style={{ gridTemplateColumns: boothGridTemplate }}
            >
              {participants.map((participant) => (
                <div
                  className="break-keep px-4 text-center font-semibold"
                  key={participant.id}
                >
                  {participant.displayName}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="scrollbar-hidden overflow-x-hidden overflow-y-auto border-r border-[#f1eee2] bg-white"
          data-testid="receipt-fixed-pane"
          onScroll={handleFixedBodyScroll}
          ref={fixedBodyRef}
        >
          <div className="divide-y divide-[#f1eee2]">
            {receipts.map((receipt) => (
              <div
                className="grid h-[88px] items-center text-sm"
                data-testid="receipt-row"
                key={receipt.id}
                style={{ gridTemplateColumns: fixedGridTemplate }}
              >
                <div className="whitespace-nowrap px-4 text-center font-display text-[13px] text-[#56564a]">
                  {formatDateTime(receipt.soldAt)}
                </div>
                <div className="truncate px-4 text-center font-mono text-[11.5px] text-[#8a8775]">
                  {receipt.receiptNo ?? "-"}
                </div>
                <div className="truncate px-4 text-center font-semibold text-[#1a1b12]">
                  {receipt.customerLabel ?? "-"}
                </div>
                <div className="px-4 text-center text-[#56564a]">
                  <ReceiptPaymentSplits receipt={receipt} />
                </div>
                <div className="px-4 text-center font-display text-[15px] font-bold text-[#1a1b12]">
                  {formatWon(receipt.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="min-w-0 overflow-auto bg-white"
          data-testid="receipt-booth-scroll"
          onScroll={handleBoothBodyScroll}
          ref={boothBodyRef}
        >
          {participants.length === 0 ? (
            <div className="flex h-full min-h-[248px] items-center justify-center px-4 text-sm text-[#8a8775]">
              마켓에 연결된 참가부스가 없습니다.
            </div>
          ) : (
            <div className="min-w-max divide-y divide-[#f1eee2]">
              {receipts.map((receipt) => {
                const amountsByParticipant =
                  getReceiptAmountsByParticipant(receipt);

                return (
                  <div
                    className="grid h-[88px] items-center text-sm"
                    key={receipt.id}
                    style={{ gridTemplateColumns: boothGridTemplate }}
                  >
                    {participants.map((participant) => (
                      <div
                        className="px-4 text-center font-display text-[13.5px] text-[#56564a]"
                        key={participant.id}
                      >
                        {formatOptionalWon(
                          amountsByParticipant.get(participant.id) ?? 0,
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceiptPaymentSplits({ receipt }: { receipt: Receipt }) {
  if (receipt.paymentSplits.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {receipt.paymentSplits.map((paymentSplit) => {
        const Icon = paymentMethodIcons[paymentSplit.paymentMethod];

        return (
          <span
            aria-label={`${paymentMethodLabels[paymentSplit.paymentMethod]} ${formatWon(
              paymentSplit.amount,
            )}`}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            key={paymentSplit.id}
          >
            <Icon
              aria-hidden="true"
              className="h-4 w-4 flex-none text-[#8a8775]"
              strokeWidth={2}
            />
            <span>{formatWon(paymentSplit.amount)}</span>
          </span>
        );
      })}
    </div>
  );
}

function SettlementPreviewPanel({
  preview,
  history,
  isLoading,
  isReceiptsLoading,
  isHistoryLoading,
  isConfirming,
  isDownloading,
  market,
  message,
  receipts,
  selectedParticipantId,
  onConfirm,
  onDownloadPdfs,
  onBackToParticipantList,
  onOpenParticipantDetail,
  onOpenSettlementDetail,
}: {
  preview: MarketSettlementPreview | null;
  history: SettlementListItem[];
  isLoading: boolean;
  isReceiptsLoading: boolean;
  isHistoryLoading: boolean;
  isConfirming: boolean;
  isDownloading: boolean;
  market: Market | null;
  message: string | null;
  receipts: Receipt[];
  selectedParticipantId: string | null;
  onConfirm: (event: FormEvent<HTMLFormElement>) => void;
  onDownloadPdfs: () => void;
  onBackToParticipantList: () => void;
  onOpenParticipantDetail: (participantId: string) => void;
  onOpenSettlementDetail: (settlementId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        정산 데이터를 불러오는 중입니다.
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        마켓을 선택하면 정산 미리보기가 표시됩니다.
      </div>
    );
  }

  if (preview.participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 참가부스가 없습니다.
      </div>
    );
  }

  const selectedParticipant = selectedParticipantId
    ? (preview.participants.find(
        (participant) => participant.participantId === selectedParticipantId,
      ) ?? null)
    : null;

  return (
    <div className="grid gap-[18px] p-0">
      <dl className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <SettlementMetric
          label="총매출"
          tone="dark"
          value={formatWon(preview.netSalesAmount)}
        />
        <SettlementMetric
          label="판매 수수료"
          value={formatWon(preview.salesCommissionAmount)}
        />
        <SettlementMetric
          label="참가부스 부담 카드 수수료"
          tone="blue"
          value={formatWon(preview.cardFeeChargedToParticipantAmount)}
        />
        <SettlementMetric
          label="마켓 부담 카드 수수료"
          tone="amber"
          value={formatWon(preview.cardFeePaidByMarketAmount)}
        />
        <SettlementMetric
          label="지급 예정"
          tone="green"
          value={formatWon(preview.participantPayoutAmount)}
        />
      </dl>
      <form
        className="grid gap-3 rounded-[16px] border border-[#e6e2d4] bg-white p-3.5 shadow-[0_1px_3px_rgba(26,27,18,0.05)] md:grid-cols-[minmax(0,1fr)_auto_auto]"
        data-testid="settlement-confirm-form"
        onSubmit={onConfirm}
      >
        <input
          className={inputClass}
          disabled={isConfirming || preview.receiptCount === 0}
          name="memo"
          placeholder="확정 메모 (예: 5월 정산 최종 확정)"
          type="text"
        />
        <button
          className={buttonVariants({ intent: "secondary" })}
          data-testid="settlement-pdf-download"
          disabled={isDownloading || preview.receiptCount === 0}
          onClick={onDownloadPdfs}
          type="button"
        >
          <Download aria-hidden className="mr-2 h-4 w-4" />
          {isDownloading ? "저장 중" : "부스별 PDF 저장"}
        </button>
        <button
          className={buttonVariants()}
          data-testid="settlement-confirm-submit"
          disabled={isConfirming || preview.receiptCount === 0}
          type="submit"
        >
          정산 확정
        </button>
        {message && (
          <p className="text-sm font-semibold text-[#cf3d3d] md:col-span-3">
            {message}
          </p>
        )}
      </form>
      {selectedParticipantId ? (
        <ParticipantDailySalesDetail
          isReceiptsLoading={isReceiptsLoading}
          market={market}
          participant={selectedParticipant}
          receipts={receipts}
          onBackToList={onBackToParticipantList}
        />
      ) : (
        <ParticipantSettlementDualChart participants={preview.participants} />
      )}
      {!selectedParticipantId && (
        <>
          <div className="min-w-0 max-w-full overflow-x-auto rounded-[18px] border border-[#e6e2d4] bg-white shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
            <table className="w-full min-w-[1240px] border-collapse text-sm">
              <thead className="bg-[#16170f] text-left font-mono text-[10px] uppercase tracking-[0.06em] text-[#9b9a86]">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">참가 부스</th>
                  <th className="px-6 py-3.5 text-right font-semibold">현금</th>
                  <th className="px-6 py-3.5 text-right font-semibold">카드</th>
                  <th className="px-6 py-3.5 text-right font-semibold">계좌이체</th>
                  <th className="px-6 py-3.5 text-right font-semibold">기타</th>
                  <th className="px-6 py-3.5 text-right font-semibold">총매출</th>
                  <th className="px-6 py-3.5 text-right font-semibold">판매 수수료</th>
                  <th className="px-6 py-3.5 text-right font-semibold">카드 수수료</th>
                  <th className="px-6 py-3.5 text-right font-semibold text-[#c7f94b]">지급 예정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eee2]">
                {preview.participants.map((participant) => (
                  <SettlementPreviewRow
                    key={participant.participantId}
                    onSelectParticipant={onOpenParticipantDetail}
                    participant={participant}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <SettlementHistoryPanel
            history={history}
            isLoading={isHistoryLoading}
            onOpenSettlementDetail={onOpenSettlementDetail}
          />
        </>
      )}
    </div>
  );
}

function SettlementHistoryPanel({
  history,
  isLoading,
  onOpenSettlementDetail,
}: {
  history: SettlementListItem[];
  isLoading: boolean;
  onOpenSettlementDetail: (settlementId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
        확정 이력을 불러오는 중입니다.
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
        확정된 정산이 없습니다.
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-200">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">정산 회차</h3>
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">회차</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">확정 시각</th>
              <th className="px-4 py-3 text-right font-medium">총매출</th>
              <th className="px-4 py-3 text-right font-medium">지급 예정</th>
              <th className="px-4 py-3 text-right font-medium">마켓 손익</th>
              <th className="px-4 py-3 font-medium">메모</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {history.map((settlement) => (
              <tr data-testid="settlement-history-row" key={settlement.id}>
                <td className="px-4 py-3 font-medium text-zinc-950">
                  v{settlement.versionNo}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {settlementStatusLabels[settlement.status]}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {formatDateTime(settlement.confirmedAt)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-zinc-950">
                  {formatWon(settlement.netSalesAmount)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-700">
                  {formatWon(settlement.participantPayoutAmount)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-700">
                  {formatWon(settlement.marketProfitAmount)}
                </td>
                <td className="max-w-[280px] truncate px-4 py-3 text-zinc-600">
                  {settlement.memo ?? "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className={buttonVariants({
                      intent: "secondary",
                      size: "sm",
                    })}
                    onClick={() => onOpenSettlementDetail(settlement.id)}
                    type="button"
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettlementMetric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "dark" | "default" | "green";
  value: string;
}) {
  const toneClass = {
    amber: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#a9791f]",
    },
    blue: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#2d6fe0]",
    },
    dark: {
      card: "border-[#16170f] bg-[#16170f]",
      label: "text-[#9b9a86]",
      value: "text-white",
    },
    default: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#1a1b12]",
    },
    green: {
      card: "border-[#bfe3cd] bg-[#e6f4ec]",
      label: "text-[#1f8a4d]",
      value: "text-[#1f8a4d]",
    },
  }[tone];

  return (
    <div className={cn("rounded-[16px] border p-[18px]", toneClass.card)}>
      <dt
        className={cn(
          "font-mono text-[10.5px] tracking-[0.05em]",
          toneClass.label,
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 font-display text-[23px] font-bold",
          toneClass.value,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ParticipantSettlementDualChart({
  participants,
}: {
  participants: ParticipantSettlementPreview[];
}) {
  const hasSales = participants.some(
    (participant) =>
      participant.netSalesAmount > 0 || participant.saleLineCount > 0,
  );

  if (!hasSales) {
    return (
      <section className="rounded-[18px] border border-[#e6e2d4] bg-white px-6 py-12 text-center text-sm text-[#8a8775] shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
        상점별 판매 데이터가 없습니다.
      </section>
    );
  }

  const chartWidth = Math.max(980, participants.length * 124 + 184);
  const chartHeight = 360;
  const chartTop = 48;
  const chartBottom = 98;
  const chartLeft = 92;
  const chartRight = 92;
  const plotWidth = chartWidth - chartLeft - chartRight;
  const plotHeight = chartHeight - chartTop - chartBottom;
  const baselineY = chartTop + plotHeight;
  const maxAmount = Math.max(
    1,
    ...participants.map((participant) => participant.netSalesAmount),
  );
  const maxSaleCount = Math.max(
    1,
    ...participants.map((participant) => participant.saleLineCount),
  );
  const xStep = plotWidth / participants.length;
  const barWidth = Math.min(48, xStep * 0.46);
  const points = participants
    .map((participant, index) => {
      const x = chartLeft + xStep * index + xStep / 2;
      const y =
        baselineY -
        (participant.saleLineCount / maxSaleCount) * plotHeight;

      return `${x},${y}`;
    })
    .join(" ");
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <section className="rounded-[18px] border border-[#e6e2d4] bg-white p-6 shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1b12]">
            상점별 판매 현황
          </h3>
          <p className="mt-1 text-xs text-[#8a8775]">
            플리마켓 기간 내 판매 금액과 판매 건수를 함께 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-medium text-[#56564a]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" />
            판매 금액
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[#18181b]" />
            판매 건수
          </span>
        </div>
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto pt-5">
        <svg
          aria-label="상점별 판매 금액과 판매 건수 그래프"
          className="block"
          height={chartHeight}
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          width={chartWidth}
        >
          <line
            stroke="#d8d3c2"
            strokeWidth="1"
            x1={chartLeft}
            x2={chartWidth - chartRight}
            y1={baselineY}
            y2={baselineY}
          />
          {yTicks.map((tick) => {
            const y = baselineY - tick * plotHeight;
            const amountValue = Math.round(maxAmount * tick);
            const saleCountValue = Math.round(maxSaleCount * tick);

            return (
              <g key={tick}>
                <line
                  stroke="#f1eee2"
                  strokeWidth="1"
                  x1={chartLeft}
                  x2={chartWidth - chartRight}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#8a8775"
                  fontSize="11"
                  textAnchor="end"
                  x={chartLeft - 10}
                  y={y + 4}
                >
                  {formatCompactWon(amountValue)}
                </text>
                <text
                  fill="#8a8775"
                  fontSize="11"
                  textAnchor="start"
                  x={chartWidth - chartRight + 10}
                  y={y + 4}
                >
                  {saleCountValue}건
                </text>
              </g>
            );
          })}
          <text
            fill="#56564a"
            fontSize="12"
            fontWeight="600"
            textAnchor="start"
            x={chartLeft}
            y="16"
          >
            금액
          </text>
          <text
            fill="#56564a"
            fontSize="12"
            fontWeight="600"
            textAnchor="end"
            x={chartWidth - chartRight}
            y="16"
          >
            건수
          </text>
          {participants.map((participant, index) => {
            const x = chartLeft + xStep * index + xStep / 2;
            const barHeight =
              (participant.netSalesAmount / maxAmount) * plotHeight;
            const y = baselineY - barHeight;

            return (
              <g key={participant.participantId}>
                <title>
                  {participant.displayName}: {formatWon(participant.netSalesAmount)},{" "}
                  {participant.saleLineCount}건
                </title>
                <rect
                  fill="#10b981"
                  height={barHeight}
                  rx="4"
                  width={barWidth}
                  x={x - barWidth / 2}
                  y={y}
                />
                <text
                  fill="#56564a"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  x={x}
                  y={baselineY + 24}
                >
                  {truncateChartLabel(participant.displayName)}
                </text>
                <text
                  fill="#8a8775"
                  fontSize="10"
                  textAnchor="middle"
                  x={x}
                  y={baselineY + 42}
                >
                  {formatCompactWon(participant.netSalesAmount)}
                </text>
              </g>
            );
          })}
          <polyline
            fill="none"
            points={points}
            stroke="#18181b"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
          {participants.map((participant, index) => {
            const x = chartLeft + xStep * index + xStep / 2;
            const y =
              baselineY -
              (participant.saleLineCount / maxSaleCount) * plotHeight;

            return (
              <g key={`${participant.participantId}-count`}>
                <circle
                  cx={x}
                  cy={y}
                  fill="#ffffff"
                  r="5"
                  stroke="#18181b"
                  strokeWidth="2"
                />
                <text
                  fill="#18181b"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  x={x}
                  y={Math.max(12, y - 10)}
                >
                  {participant.saleLineCount}건
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

type ParticipantDailySalesPoint = {
  date: string;
  amount: number;
  saleCount: number;
};

function ParticipantDailySalesDetail({
  isReceiptsLoading,
  market,
  participant,
  receipts,
  onBackToList,
}: {
  isReceiptsLoading: boolean;
  market: Market | null;
  participant: ParticipantSettlementPreview | null;
  receipts: Receipt[];
  onBackToList: () => void;
}) {
  if (!participant) {
    return (
      <section className="rounded-[18px] border border-[#e6e2d4] bg-white px-6 py-12 text-center text-sm text-[#8a8775] shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
        선택한 참가부스 정산 데이터를 찾을 수 없습니다.
      </section>
    );
  }

  if (isReceiptsLoading) {
    return (
      <section className="rounded-[18px] border border-[#e6e2d4] bg-white px-6 py-12 text-center text-sm text-[#8a8775] shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
        날짜별 판매 데이터를 불러오는 중입니다.
      </section>
    );
  }

  const dailySales = buildParticipantDailySales(
    participant.participantId,
    receipts,
    market?.startsOn ?? null,
    market?.endsOn ?? null,
  );

  return (
    <section className="rounded-[18px] border border-[#e6e2d4] bg-white p-6 shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1b12]">
            {participant.displayName} 날짜별 판매
          </h3>
          <p className="mt-1 text-xs text-[#8a8775]">
            {participantTypeLabels[participant.participantType]} ·{" "}
            {formatMarketDuration(market?.startsOn ?? null, market?.endsOn ?? null)}
          </p>
        </div>
        <div className="grid gap-2 lg:justify-items-end">
          <button
            className={buttonVariants({ intent: "secondary", size: "sm" })}
            onClick={onBackToList}
            type="button"
          >
            <ArrowLeft aria-hidden className="mr-1.5 h-3.5 w-3.5" />
            목록
          </button>
          <dl className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[10px] border border-[#e6e2d4] bg-[#fcfbf6] px-3 py-2">
              <dt className="text-xs font-medium text-[#8a8775]">총매출</dt>
              <dd className="mt-1 text-sm font-semibold text-[#1a1b12]">
                {formatWon(participant.netSalesAmount)}
              </dd>
            </div>
            <div className="rounded-[10px] border border-[#e6e2d4] bg-[#fcfbf6] px-3 py-2">
              <dt className="text-xs font-medium text-[#8a8775]">판매 건수</dt>
              <dd className="mt-1 text-sm font-semibold text-[#1a1b12]">
                {participant.saleLineCount}건
              </dd>
            </div>
            <div className="rounded-[10px] border border-[#e6e2d4] bg-[#fcfbf6] px-3 py-2">
              <dt className="text-xs font-medium text-[#8a8775]">평균 판매</dt>
              <dd className="mt-1 text-sm font-semibold text-[#1a1b12]">
                {formatWon(
                  participant.saleLineCount > 0
                    ? Math.round(
                        participant.netSalesAmount / participant.saleLineCount,
                      )
                    : 0,
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <ParticipantDailySalesChart points={dailySales} />
    </section>
  );
}

function ParticipantDailySalesChart({
  points,
}: {
  points: ParticipantDailySalesPoint[];
}) {
  const hasSales = points.some((point) => point.amount > 0 || point.saleCount > 0);

  if (!hasSales) {
    return (
      <div className="py-10 text-center text-sm text-[#8a8775]">
        날짜별 판매 데이터가 없습니다.
      </div>
    );
  }

  const chartWidth = Math.max(820, points.length * 112 + 184);
  const chartHeight = 340;
  const chartTop = 48;
  const chartBottom = 92;
  const chartLeft = 92;
  const chartRight = 92;
  const plotWidth = chartWidth - chartLeft - chartRight;
  const plotHeight = chartHeight - chartTop - chartBottom;
  const baselineY = chartTop + plotHeight;
  const maxAmount = Math.max(1, ...points.map((point) => point.amount));
  const maxSaleCount = Math.max(1, ...points.map((point) => point.saleCount));
  const xStep = plotWidth / points.length;
  const barWidth = Math.min(42, xStep * 0.44);
  const linePoints = points
    .map((point, index) => {
      const x = chartLeft + xStep * index + xStep / 2;
      const y = baselineY - (point.saleCount / maxSaleCount) * plotHeight;

      return `${x},${y}`;
    })
    .join(" ");
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="min-w-0 max-w-full overflow-x-auto pt-5">
      <svg
        aria-label="날짜별 판매 금액과 판매 건수 그래프"
        className="block"
        height={chartHeight}
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width={chartWidth}
      >
        <line
          stroke="#d8d3c2"
          strokeWidth="1"
          x1={chartLeft}
          x2={chartWidth - chartRight}
          y1={baselineY}
          y2={baselineY}
        />
        {yTicks.map((tick) => {
          const y = baselineY - tick * plotHeight;
          const amountValue = Math.round(maxAmount * tick);
          const saleCountValue = Math.round(maxSaleCount * tick);

          return (
            <g key={tick}>
              <line
                stroke="#f1eee2"
                strokeWidth="1"
                x1={chartLeft}
                x2={chartWidth - chartRight}
                y1={y}
                y2={y}
              />
              <text
                fill="#8a8775"
                fontSize="11"
                textAnchor="end"
                x={chartLeft - 10}
                y={y + 4}
              >
                {formatCompactWon(amountValue)}
              </text>
              <text
                fill="#8a8775"
                fontSize="11"
                textAnchor="start"
                x={chartWidth - chartRight + 10}
                y={y + 4}
              >
                {saleCountValue}건
              </text>
            </g>
          );
        })}
        <text
          fill="#56564a"
          fontSize="12"
          fontWeight="600"
          textAnchor="start"
          x={chartLeft}
          y="16"
        >
          금액
        </text>
        <text
          fill="#56564a"
          fontSize="12"
          fontWeight="600"
          textAnchor="end"
          x={chartWidth - chartRight}
          y="16"
        >
          건수
        </text>
        {points.map((point, index) => {
          const x = chartLeft + xStep * index + xStep / 2;
          const barHeight = (point.amount / maxAmount) * plotHeight;
          const y = baselineY - barHeight;

          return (
            <g key={point.date}>
              <title>
                {formatDate(point.date)}: {formatWon(point.amount)},{" "}
                {point.saleCount}건
              </title>
              <rect
                fill="#10b981"
                height={barHeight}
                rx="4"
                width={barWidth}
                x={x - barWidth / 2}
                y={y}
              />
              <text
                fill="#56564a"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                x={x}
                y={baselineY + 24}
              >
                {formatChartDateLabel(point.date)}
              </text>
              <text
                fill="#8a8775"
                fontSize="10"
                textAnchor="middle"
                x={x}
                y={baselineY + 42}
              >
                {formatCompactWon(point.amount)}
              </text>
            </g>
          );
        })}
        <polyline
          fill="none"
          points={linePoints}
          stroke="#18181b"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        {points.map((point, index) => {
          const x = chartLeft + xStep * index + xStep / 2;
          const y = baselineY - (point.saleCount / maxSaleCount) * plotHeight;

          return (
            <g key={`${point.date}-count`}>
              <circle
                cx={x}
                cy={y}
                fill="#ffffff"
                r="5"
                stroke="#18181b"
                strokeWidth="2"
              />
              <text
                fill="#18181b"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                x={x}
                y={Math.max(12, y - 10)}
              >
                {point.saleCount}건
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SettlementPreviewRow({
  onSelectParticipant,
  participant,
}: {
  onSelectParticipant: (participantId: string) => void;
  participant: ParticipantSettlementPreview;
}) {
  return (
    <tr
      className="cursor-pointer transition hover:bg-[#fcfdf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c7f94b]"
      data-testid="settlement-row"
      onClick={() => onSelectParticipant(participant.participantId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectParticipant(participant.participantId);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <td className="px-6 py-4">
        <p className="text-[14.5px] font-semibold text-[#1a1b12]">
          {participant.displayName}
        </p>
        <p className="mt-1 flex items-center gap-1.5">
          <ParticipantTypeBadge type={participant.participantType} />
          <span className="font-mono text-[10.5px] text-[#a8a593]">
            {participant.saleLineCount}건
          </span>
        </p>
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.cashSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.cardSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.transferSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.otherSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[14.5px] font-bold text-[#1a1b12]">
        {formatWon(participant.netSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] font-semibold text-[#1a1b12]">
        {formatWon(participant.salesCommissionAmount)}
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {formatPercent(participant.salesCommissionRate)}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] font-semibold text-[#2d6fe0]">
        {formatWon(participant.cardFeeAmount)}
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {formatPercent(participant.cardFeeRate)}
        </span>
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {participant.cardFeePayer === "participant" ? "참가부스" : "마켓"}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-display text-[15px] font-bold text-[#1f8a4d]">
        {formatWon(participant.payoutAmount)}
      </td>
    </tr>
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

function getParticipantFeePolicySource(
  participant: Participant,
  hasMarketSettings: boolean,
): FeeSettingScope {
  if (participant.settings?.feeSettingOverrideEnabled) {
    return "booth";
  }

  return hasMarketSettings ? "market" : "global";
}

function getParticipantFeeFieldPolicySource(
  participant: Participant,
  marketSettings: SettlementDefaultSettings | null | undefined,
  field: FeeSettingFieldKey,
): FeeSettingScope {
  const fieldValue = participant.settings?.[field];

  if (
    participant.settings?.feeSettingOverrideEnabled &&
    fieldValue !== null &&
    fieldValue !== undefined
  ) {
    return "booth";
  }

  return marketSettings?.id ? "market" : "global";
}

function formatParticipantFeeFieldDisplay(
  participant: Participant,
  globalSettings: SettlementDefaultSettings | null | undefined,
  marketSettings: SettlementDefaultSettings | null | undefined,
  field: FeeSettingFieldKey,
): string {
  const source = getParticipantFeeFieldPolicySource(
    participant,
    marketSettings,
    field,
  );
  const value = getParticipantFeeFieldValue(
    participant,
    globalSettings,
    marketSettings,
    field,
    source,
  );

  return `${feeSettingScopeLabels[source]} ${formatFeeFieldValue(field, value)}`;
}

function getParticipantFeeFieldValue(
  participant: Participant,
  globalSettings: SettlementDefaultSettings | null | undefined,
  marketSettings: SettlementDefaultSettings | null | undefined,
  field: FeeSettingFieldKey,
  source: FeeSettingScope,
): SettlementFeeSettings[FeeSettingFieldKey] | null {
  if (source === "booth") {
    return participant.settings?.[field] ?? null;
  }

  if (source === "market") {
    return getScopedFeeFieldValue("market", marketSettings, field);
  }

  return getScopedFeeFieldValue("global", globalSettings, field);
}

function getScopedFeeFieldValue(
  scope: FeeSettingScope,
  settings:
    | SettlementDefaultSettings
    | Participant["settings"]
    | null
    | undefined,
  field: FeeSettingFieldKey,
): SettlementFeeSettings[FeeSettingFieldKey] | null {
  if (!settings) {
    return null;
  }

  if (scope === "booth") {
    return settings[field] ?? null;
  }

  return settings[field] ?? defaultFeeSettings[field];
}

function formatFeeFieldValue(
  field: FeeSettingFieldKey,
  value: SettlementFeeSettings[FeeSettingFieldKey] | null,
  fallbackScope?: FeeSettingScope,
): string {
  if (value === null || value === undefined) {
    return fallbackScope
      ? `${feeSettingScopeLabels[fallbackScope]} 사용`
      : "미설정";
  }

  switch (field) {
    case "salesCommissionRate":
    case "cardFeeRate":
      return formatPercent(value as number);
    case "cardFeePayer":
      return cardFeePayerLabels[value as CardFeePayer];
    case "participationFeeAmount":
      return formatWon(value as number);
    default:
      return String(value);
  }
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

function getParticipantFeeSettingsDefaults(
  participant: Participant | null,
): SettlementFeeSettings {
  const settings = participant?.settings;

  if (!settings?.feeSettingOverrideEnabled) {
    return defaultFeeSettings;
  }

  return {
    settlementType: "commission",
    salesCommissionRate:
      settings.salesCommissionRate ?? defaultFeeSettings.salesCommissionRate,
    cardFeeRate: settings.cardFeeRate ?? defaultFeeSettings.cardFeeRate,
    cardFeePayer: settings.cardFeePayer ?? defaultFeeSettings.cardFeePayer,
    participationFeeAmount:
      settings.participationFeeAmount ??
      defaultFeeSettings.participationFeeAmount,
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

function formatDateRange(
  startsOn: string | null,
  endsOn: string | null,
): string {
  if (!startsOn && !endsOn) {
    return "-";
  }

  if (startsOn && endsOn) {
    return `${startsOn} - ${endsOn}`;
  }

  return startsOn ?? endsOn ?? "-";
}

function formatMarketDuration(
  startsOn: string | null,
  endsOn: string | null,
): string {
  if (!startsOn && !endsOn) {
    return "-";
  }

  if (!startsOn || !endsOn) {
    return "1일";
  }

  const startTime = new Date(`${startsOn}T00:00:00`).getTime();
  const endTime = new Date(`${endsOn}T00:00:00`).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return "-";
  }

  const days = Math.max(
    1,
    Math.floor((endTime - startTime) / 86_400_000) + 1,
  );

  return `${days}일`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getDefaultReceiptDateTimeInputValue(
  startsOn: string | null,
  endsOn: string | null,
): string {
  const now = new Date();

  if (isDateTimeWithinReceiptPeriod(now, startsOn, endsOn)) {
    return formatDateTimeInputValue(now);
  }

  const endDate = parseDateOnly(endsOn ?? "");
  if (endDate) {
    endDate.setHours(23, 59, 0, 0);
    return formatDateTimeInputValue(endDate);
  }

  const startDate = parseDateOnly(startsOn ?? "");
  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
    return formatDateTimeInputValue(startDate);
  }

  return formatDateTimeInputValue(now);
}

function buildReceiptSoldAtFromDateTimeInput(
  value: string,
  startsOn: string | null,
  endsOn: string | null,
): string {
  const date = parseLocalDateTimeInput(value);

  if (!date) {
    throw new Error("구매 날짜와 시간을 입력해주세요.");
  }

  if (!isDateTimeWithinReceiptPeriod(date, startsOn, endsOn)) {
    throw new Error("구매 날짜와 시간은 플리마켓 기간 내로 설정해주세요.");
  }

  return date.toISOString();
}

function getReceiptDateTimeMin(startsOn: string | null): string | undefined {
  return startsOn ? `${startsOn}T00:00` : undefined;
}

function getReceiptDateTimeMax(endsOn: string | null): string | undefined {
  return endsOn ? `${endsOn}T23:59` : undefined;
}

function isDateTimeWithinReceiptPeriod(
  date: Date,
  startsOn: string | null,
  endsOn: string | null,
): boolean {
  const startDate = parseDateOnly(startsOn ?? "");
  const endDate = parseDateOnly(endsOn ?? "");

  if (startDate && date.getTime() < startDate.getTime()) {
    return false;
  }

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    if (date.getTime() > endDate.getTime()) {
      return false;
    }
  }

  return true;
}

function parseLocalDateTimeInput(value: string): Date | null {
  const [datePart, timePart] = value.split("T");
  const date = parseDateOnly(datePart ?? "");

  if (!date || !timePart) {
    return null;
  }

  const [hours, minutes] = timePart.split(":").map(Number);

  if (
    hours === undefined ||
    minutes === undefined ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDateTimeInputValue(date: Date): string {
  return `${getDateOnlyKey(date)}T${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatChartDateLabel(value: string): string {
  const [, month, day] = value.split("-");

  return month && day ? `${Number(month)}/${Number(day)}` : value;
}

function buildParticipantDailySales(
  participantId: string,
  receipts: Receipt[],
  startsOn: string | null,
  endsOn: string | null,
): ParticipantDailySalesPoint[] {
  const salesByDate = new Map<string, ParticipantDailySalesPoint>();

  for (const receipt of receipts) {
    const date = getLocalDateKey(receipt.soldAt);

    for (const saleLine of receipt.saleLines) {
      if (saleLine.participantId !== participantId) {
        continue;
      }

      const point = salesByDate.get(date) ?? {
        date,
        amount: 0,
        saleCount: 0,
      };

      point.amount += saleLine.netAmount;
      point.saleCount += 1;
      salesByDate.set(date, point);
    }
  }

  const dateRange = buildDateRange(
    startsOn ?? getFirstSalesDate(salesByDate),
    endsOn ?? getLastSalesDate(salesByDate),
  );

  if (dateRange.length === 0) {
    return [...salesByDate.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  return dateRange.map(
    (date) =>
      salesByDate.get(date) ?? {
        date,
        amount: 0,
        saleCount: 0,
      },
  );
}

function buildDateRange(
  startsOn: string | null,
  endsOn: string | null,
): string[] {
  if (!startsOn && !endsOn) {
    return [];
  }

  const startDate = parseDateOnly(startsOn ?? endsOn ?? "");
  const endDate = parseDateOnly(endsOn ?? startsOn ?? "");

  if (!startDate || !endDate) {
    return [];
  }

  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate.getTime() <= endDate.getTime()) {
    dates.push(getDateOnlyKey(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function parseDateOnly(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getLocalDateKey(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return getDateOnlyKey(date);
}

function getDateOnlyKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getFirstSalesDate(
  salesByDate: Map<string, ParticipantDailySalesPoint>,
): string | null {
  return [...salesByDate.keys()].sort()[0] ?? null;
}

function getLastSalesDate(
  salesByDate: Map<string, ParticipantDailySalesPoint>,
): string | null {
  return [...salesByDate.keys()].sort().at(-1) ?? null;
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

function formatWon(value: number): string {
  return `${formatMoneyAmount(value)}원`;
}

function formatCompactWon(value: number): string {
  if (value >= 100_000_000) {
    return `${formatCompactNumber(value / 100_000_000)}억`;
  }

  if (value >= 10_000) {
    return `${formatCompactNumber(value / 10_000)}만`;
  }

  return `${formatMoneyAmount(value)}원`;
}

function formatCompactNumber(value: number): string {
  return value >= 10
    ? String(Math.round(value))
    : value.toFixed(1).replace(/\.0$/, "");
}

function truncateChartLabel(value: string): string {
  return value.length > 7 ? `${value.slice(0, 7)}...` : value;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace(/\\.00$/, "")}%`;
}

function formatRateInput(value: number | null | undefined): string {
  return value === null || value === undefined
    ? ""
    : String(Number((value * 100).toFixed(4)));
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getReceiptAmountsByParticipant(receipt: Receipt): Map<string, number> {
  const amounts = new Map<string, number>();

  for (const saleLine of receipt.saleLines) {
    amounts.set(
      saleLine.participantId,
      (amounts.get(saleLine.participantId) ?? 0) + saleLine.netAmount,
    );
  }

  return amounts;
}

function formatOptionalWon(value: number): string {
  return value > 0 ? formatWon(value) : "-";
}
