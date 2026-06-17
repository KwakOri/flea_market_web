"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, UIEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Download,
  Landmark,
  type LucideIcon,
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
  useParticipantMasters,
  useParticipants,
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
  ParticipantType,
  SettlementType,
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
import { cn } from "@/lib/utils";
import {
  appShellClass,
  buttonVariants,
  compactSelectClass,
  dashboardTabListClass,
  dashboardTabVariants,
  inputClass,
  pageShellClass,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
  selectClass,
  statCardVariants,
} from "@/lib/design-system";

const marketStatusLabels: Record<MarketStatus, string> = {
  draft: "준비",
  active: "운영",
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

const paymentMethods: PaymentMethod[] = ["cash", "card", "transfer", "other"];

const settlementTypeLabels: Record<SettlementType, string> = {
  commission: "수수료",
  manual: "수기",
  investment: "투자",
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
  { key: "settlementType", label: "정산 방식" },
  { key: "salesCommissionRate", label: "판매 수수료" },
  { key: "cardFeeRate", label: "카드 수수료" },
  { key: "cardFeePayer", label: "카드 부담" },
  { key: "participationFeeAmount", label: "참가비" },
];

type DashboardView =
  | "home"
  | "management"
  | "boothMasters"
  | "booths"
  | "feeStatus"
  | "salesMatrix"
  | "receiptLookup"
  | "settlements";

type ReceiptLineDraft = {
  participantId: string;
  participantName: string;
  amount: number;
};

const dashboardViewLabels: Record<DashboardView, string> = {
  home: "관리 홈",
  management: "마켓관리",
  boothMasters: "부스관리",
  booths: "참가부스관리",
  feeStatus: "수수료 현황",
  salesMatrix: "영수증 입력",
  receiptLookup: "영수증 조회",
  settlements: "정산",
};

const dashboardTabs: Array<{
  label: string;
  segment: string;
  view: DashboardView;
}> = [
  { label: "마켓관리", segment: "management", view: "management" },
  { label: "참가부스관리", segment: "booths", view: "booths" },
  { label: "수수료 현황", segment: "fees", view: "feeStatus" },
  { label: "영수증 입력", segment: "sales", view: "salesMatrix" },
  { label: "영수증조회", segment: "receipts", view: "receiptLookup" },
  { label: "정산", segment: "settlements", view: "settlements" },
];

export function DashboardClient({
  marketId,
  view = "home",
}: {
  marketId?: string;
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
  const [settlementMessage, setSettlementMessage] = useState<string | null>(
    null,
  );
  const [globalFeeSettingsMessage, setGlobalFeeSettingsMessage] = useState<
    string | null
  >(null);
  const [marketFeeSettingsMessage, setMarketFeeSettingsMessage] = useState<
    string | null
  >(null);
  const [requestedParticipantId, setRequestedParticipantId] = useState<
    string | null
  >(null);
  const [matrixReceiptAmounts, setMatrixReceiptAmounts] = useState<
    Record<string, string>
  >({});
  const [matrixPaymentMode, setMatrixPaymentMode] = useState<
    "single" | "split"
  >("single");
  const [matrixSinglePaymentMethod, setMatrixSinglePaymentMethod] =
    useState<PaymentMethod>("cash");
  const [matrixPaymentSplits, setMatrixPaymentSplits] = useState<
    Record<PaymentMethod, string>
  >(getEmptyPaymentSplitAmounts);

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
  const createParticipant = useCreateParticipant(selectedMarketId);
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
  const selectedParticipant = useMemo(
    () =>
      participants.data?.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null,
    [participants.data, selectedParticipantId],
  );
  const matrixReceiptTotal = useMemo(
    () => sumReceiptAmounts(matrixReceiptAmounts),
    [matrixReceiptAmounts],
  );
  const matrixPaymentSplitTotal = useMemo(
    () => sumReceiptAmounts(matrixPaymentSplits),
    [matrixPaymentSplits],
  );
  const matrixPaymentRemaining = Math.max(
    matrixReceiptTotal - matrixPaymentSplitTotal,
    0,
  );
  const summary = [
    { label: "마켓", value: String(markets.data?.length ?? 0) },
    { label: "참가부스", value: String(participantMasters.data?.length ?? 0) },
    { label: "마켓 참가", value: String(participants.data?.length ?? 0) },
    { label: "상품", value: String(products.data?.length ?? 0) },
    { label: "영수증", value: String(receipts.data?.length ?? 0) },
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
      router.push(`/markets/${market.id}/management`);
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
  }

  async function handleMarketStatusChange(
    marketId: string,
    status: MarketStatus,
  ) {
    setMarketMessage(null);

    try {
      await updateMarket.mutateAsync({
        marketId,
        payload: { status },
      });
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
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
      setGlobalFeeSettingsMessage("전체 수수료 기본값을 저장했습니다.");
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
      setMarketFeeSettingsMessage("플리마켓 수수료 기본값을 저장했습니다.");
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
    } catch (error) {
      setParticipantMasterMessage(getErrorMessage(error));
    }
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
      const participant = await createParticipant.mutateAsync({
        participantId,
        participantType: getFormString(
          formData,
          "participantType",
        ) as ParticipantType,
        ...getOptionalFeeSettingsPayload(formData),
      });

      setRequestedParticipantId(participant.id);
      form.reset();
    } catch (error) {
      setParticipantMessage(getErrorMessage(error));
    }
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
      const saleLines = getReceiptLinesFromAmounts(
        matrixReceiptAmounts,
        participants.data ?? [],
      );

      await createReceipt.mutateAsync(
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
        }),
      );

      setMatrixReceiptAmounts({});
      setMatrixPaymentSplits(getEmptyPaymentSplitAmounts());
      form.reset();
    } catch (error) {
      setReceiptMessage(getErrorMessage(error));
    }
  }

  function handleMatrixReceiptAmountChange(
    participantId: string,
    amount: string,
  ) {
    const nextAmounts = {
      ...matrixReceiptAmounts,
      [participantId]: formatMoneyInput(amount),
    };
    const nextTotal = sumReceiptAmounts(nextAmounts);

    setMatrixReceiptAmounts(nextAmounts);
    setMatrixPaymentSplits((currentSplits) =>
      clampPaymentSplitAmounts(currentSplits, nextTotal),
    );
  }

  function handleMatrixPaymentModeChange(mode: "single" | "split") {
    setMatrixPaymentMode(mode);
    setMatrixPaymentSplits(getEmptyPaymentSplitAmounts());
  }

  function handleMatrixPaymentSplitChange(
    paymentMethod: PaymentMethod,
    amount: string,
  ) {
    setMatrixPaymentSplits((current) => {
      const nextAmount = parseOptionalReceiptAmount(amount) ?? 0;
      const otherTotal = paymentMethods.reduce(
        (sum, currentPaymentMethod) =>
          currentPaymentMethod === paymentMethod
            ? sum
            : sum +
              (parseOptionalReceiptAmount(current[currentPaymentMethod]) ?? 0),
        0,
      );
      const allowedAmount = Math.max(matrixReceiptTotal - otherTotal, 0);
      const clampedAmount = Math.min(nextAmount, allowedAmount);

      return {
        ...current,
        [paymentMethod]:
          clampedAmount > 0 ? formatMoneyAmount(clampedAmount) : "",
      };
    });
  }

  function handleMatrixPaymentFillRemaining(paymentMethod: PaymentMethod) {
    setMatrixPaymentSplits((current) => {
      const otherTotal = paymentMethods.reduce(
        (sum, currentPaymentMethod) =>
          currentPaymentMethod === paymentMethod
            ? sum
            : sum +
              (parseOptionalReceiptAmount(current[currentPaymentMethod]) ?? 0),
        0,
      );
      const remainingAmount = Math.max(matrixReceiptTotal - otherTotal, 0);

      return {
        ...current,
        [paymentMethod]:
          remainingAmount > 0 ? formatMoneyAmount(remainingAmount) : "",
      };
    });
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

      setSettlementMessage(`v${settlement.versionNo} 정산이 확정되었습니다.`);
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
      setSettlementMessage("부스별 정산 PDF를 다운로드했습니다.");
    } catch (error) {
      setSettlementMessage(getErrorMessage(error));
    }
  }

  return (
    <main className={pageShellClass}>
      <div className={appShellClass}>
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-emerald-700">
              Flea Market Settlement
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
              {dashboardViewLabels[view]}
            </h1>
            {selectedMarket && (
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {selectedMarket.name} ·{" "}
                {formatDateRange(selectedMarket.startsOn, selectedMarket.endsOn)}
              </p>
            )}
            {marketId && (
              <nav
                aria-label="업무 화면"
                className={cn("mt-4", dashboardTabListClass)}
                role="tablist"
              >
                {dashboardTabs.map((tab) => {
                  const isActive = view === tab.view;

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      aria-selected={isActive}
                      className={dashboardTabVariants({ active: isActive })}
                      href={`/markets/${marketId}/${tab.segment}`}
                      key={tab.view}
                      role="tab"
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <section
            className={cn(
              panelVariants({ padding: "sm" }),
              "lg:min-w-[520px]",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  {user.displayName}
                </p>
                <p className="text-xs text-zinc-500" data-testid="user-email">
                  {user.email}
                </p>
              </div>
              <button
                className={buttonVariants({ intent: "secondary" })}
                disabled={logout.isPending}
                onClick={handleLogout}
                type="button"
              >
                로그아웃
              </button>
            </div>
          </section>
        </header>

        {shouldShowSummary && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summary.map((item) => (
              <div className={statCardVariants()} key={item.label}>
                <p className="text-sm font-medium text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {item.value}
                </p>
              </div>
            ))}
          </section>
        )}

        {view === "home" && (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
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
            </section>
            <section className={panelVariants()}>
              <div className={sectionHeaderClass}>
                <h2 className={sectionTitleClass}>전체 수수료 기본 설정</h2>
                <p className={sectionDescriptionClass}>
                  플리마켓별 설정이나 부스별 설정이 비어 있으면 이 값이
                  적용됩니다.
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
          </>
        )}

        {view === "management" && (
          <section className={panelVariants()}>
            <div
              className={cn(
                sectionHeaderClass,
                "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
              )}
            >
              <div>
                <h2 className={sectionTitleClass}>
                  {marketId ? "마켓 정보" : "플리마켓 선택"}
                </h2>
                <p className={sectionDescriptionClass}>
                  {marketId
                    ? "선택한 플리마켓의 기본 정보를 확인합니다."
                    : "작업할 플리마켓을 먼저 선택합니다."}
                </p>
              </div>
              {marketId ? (
                <Link
                  className={buttonVariants({ intent: "secondary" })}
                  href="/markets"
                >
                  마켓 선택
                </Link>
              ) : (
                <form
                  className="grid gap-2 md:grid-cols-[180px_160px_160px_1fr_auto]"
                  data-testid="market-form"
                  onSubmit={handleCreateMarket}
                >
                  <input
                    className={inputClass}
                    disabled={!user}
                    name="name"
                    placeholder="마켓명"
                    type="text"
                  />
                  <input
                    className={inputClass}
                    disabled={!user}
                    name="startsOn"
                    type="date"
                  />
                  <input
                    className={inputClass}
                    disabled={!user}
                    name="endsOn"
                    type="date"
                  />
                  <input
                    className={inputClass}
                    disabled={!user}
                    name="description"
                    placeholder="메모"
                    type="text"
                  />
                  <button
                    className={buttonVariants()}
                    disabled={!user || createMarket.isPending}
                    type="submit"
                  >
                    추가
                  </button>
                </form>
              )}
            </div>
            {marketMessage && (
              <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                {marketMessage}
              </p>
            )}
            {marketId ? (
              <>
                <MarketDetailPanel
                  market={selectedMarket}
                  onStatusChange={handleMarketStatusChange}
                />
                <div className="border-t border-zinc-200">
                  <div className={sectionHeaderClass}>
                    <h2 className={sectionTitleClass}>
                      플리마켓 수수료 기본 설정
                    </h2>
                    <p className={sectionDescriptionClass}>
                      부스별 설정이 비어 있으면 이 값이 전체 설정보다 우선
                      적용됩니다.
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
              </>
            ) : (
              <MarketSelectionCards
                actionLabel="선택하고 관리"
                markets={markets.data ?? []}
                selectedMarketId={null}
                onSelectMarket={(selectedId) =>
                  router.push(`/markets/${selectedId}/management`)
                }
              />
            )}
          </section>
        )}

        {view === "boothMasters" && (
          <section className={panelVariants()}>
            <ParticipantMasterManagementHeader
              isCreating={createParticipantMaster.isPending}
              message={participantMasterMessage}
              onSubmit={handleCreateParticipantMaster}
            />
            <ParticipantMasterTable
              participants={participantMasters.data ?? []}
              showLinkStatus={false}
            />
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
                <Link
                  className={buttonVariants({ intent: "secondary" })}
                  href="/booths"
                >
                  부스 관리
                </Link>
              </div>
              <form
                className="grid gap-3 p-4"
                data-testid="participant-form"
                onSubmit={handleCreateParticipant}
              >
                <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px]">
                  <select
                    className={selectClass}
                    defaultValue=""
                    disabled={
                      !selectedMarket || !unlinkedParticipantMasters.length
                    }
                    name="participantId"
                  >
                    <option value="">참가부스 선택</option>
                    {unlinkedParticipantMasters.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.displayName}
                      </option>
                    ))}
                  </select>
                  <select
                    className={selectClass}
                    defaultValue="seller"
                    disabled={!selectedMarket}
                    name="participantType"
                  >
                    <option value="seller">셀러</option>
                    <option value="staff">운영진</option>
                    <option value="special_booth">특수 부스</option>
                  </select>
                </div>
                <FeeSettingsFields
                  allowInheritance
                  defaultValues={null}
                  disabled={!selectedMarket}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-zinc-500">
                    비워둔 수수료 항목은 플리마켓 기본값, 전체 기본값 순으로
                    적용됩니다.
                  </p>
                  <button
                    className={buttonVariants()}
                    disabled={
                      !selectedMarket ||
                      !unlinkedParticipantMasters.length ||
                      createParticipant.isPending
                    }
                    type="submit"
                  >
                    마켓에 연결
                  </button>
                </div>
                {participantMessage && (
                  <p className="text-sm font-medium text-red-700">
                    {participantMessage}
                  </p>
                )}
              </form>
              <ParticipantList
                emptyMessage="연결된 참가부스가 없습니다."
                participants={participants.data ?? []}
                selectedParticipantId={selectedParticipantId}
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
                  className="grid gap-2 lg:grid-cols-[200px_220px_160px_140px_auto]"
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
          <section className={panelVariants()}>
            <div
              className={cn(
                sectionHeaderClass,
                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div>
                <h2 className={sectionTitleClass}>수수료 적용 현황</h2>
                <p className={sectionDescriptionClass}>
                  부스별로 전체 설정, 플리마켓 설정, 부스 설정 중 어떤 값이
                  적용되는지 확인합니다.
                </p>
              </div>
              <Link
                className={buttonVariants({ intent: "secondary" })}
                href={`/markets/${marketId}/management`}
              >
                설정 수정
              </Link>
            </div>
            <FeeApplicationMatrix
              globalSettings={globalFeeSettings.data ?? null}
              isLoading={
                globalFeeSettings.isLoading ||
                marketFeeSettings.isLoading ||
                participants.isLoading
              }
              marketSettings={marketFeeSettings.data ?? null}
              participants={participants.data ?? []}
            />
          </section>
        )}

        {view === "salesMatrix" && (
          <section className={panelVariants()}>
                <div
                  className={cn(
                    sectionHeaderClass,
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div>
                    <h2 className={sectionTitleClass}>영수증 입력</h2>
                    <p className={sectionDescriptionClass}>
                      {selectedMarket?.name ?? "마켓 미선택"}
                    </p>
                  </div>
                  <Link
                    className={buttonVariants({ intent: "secondary" })}
                    href="/markets"
                  >
                    마켓 선택
                  </Link>
                </div>
                <form
                  className="grid gap-0"
                  data-testid="receipt-matrix-form"
                  onSubmit={handleCreateMatrixReceipt}
                >
                  {receiptMessage && (
                    <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                      {receiptMessage}
                    </p>
                  )}
                  <ReceiptMatrixInputTable
                    amounts={matrixReceiptAmounts}
                    onAmountChange={handleMatrixReceiptAmountChange}
                    participants={participants.data ?? []}
                  />
                  <div className="grid gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <div
                        className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white px-4 py-3"
                        data-testid="receipt-matrix-total"
                      >
                        <span className="text-sm font-medium text-zinc-600">
                          종합 금액
                        </span>
                        <span className="text-lg font-semibold text-zinc-950">
                          {formatWon(matrixReceiptTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white px-4 py-3">
                        <span className="text-sm font-medium text-zinc-600">
                          결제 입력
                        </span>
                        <span className="text-lg font-semibold text-zinc-950">
                          {formatWon(
                            matrixPaymentMode === "split"
                              ? matrixPaymentSplitTotal
                              : matrixReceiptTotal,
                          )}
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white px-4 py-3"
                        data-testid="receipt-matrix-payment-remaining"
                      >
                        <span className="text-sm font-medium text-zinc-600">
                          남은 금액
                        </span>
                        <span className="text-lg font-semibold text-emerald-700">
                          {formatWon(
                            matrixPaymentMode === "split"
                              ? matrixPaymentRemaining
                              : 0,
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3">
                      <div className="inline-flex w-fit rounded-lg border border-zinc-200 bg-zinc-100 p-1">
                        <button
                          className={buttonVariants({
                            intent:
                              matrixPaymentMode === "single"
                                ? "primary"
                                : "quiet",
                            size: "sm",
                          })}
                          onClick={() =>
                            handleMatrixPaymentModeChange("single")
                          }
                          type="button"
                        >
                          단일 결제
                        </button>
                        <button
                          className={buttonVariants({
                            intent:
                              matrixPaymentMode === "split"
                                ? "primary"
                                : "quiet",
                            size: "sm",
                          })}
                          onClick={() => handleMatrixPaymentModeChange("split")}
                          type="button"
                        >
                          분할 결제
                        </button>
                      </div>
                      {matrixPaymentMode === "single" ? (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {paymentMethods.map((paymentMethod) => {
                            const Icon = paymentMethodIcons[paymentMethod];
                            const isActive =
                              matrixSinglePaymentMethod === paymentMethod;

                            return (
                              <button
                                className={cn(
                                  "flex h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                                  isActive
                                    ? "border-zinc-950 bg-zinc-950 text-white"
                                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                                )}
                                disabled={!participants.data?.length}
                                key={paymentMethod}
                                onClick={() =>
                                  setMatrixSinglePaymentMethod(paymentMethod)
                                }
                                type="button"
                              >
                                <Icon
                                  aria-hidden="true"
                                  className="h-4 w-4 flex-none"
                                />
                                <span className="whitespace-nowrap">
                                  {paymentMethodLabels[paymentMethod]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                          {paymentMethods.map((paymentMethod) => {
                            const Icon = paymentMethodIcons[paymentMethod];

                            return (
                              <div
                                className="grid gap-2 rounded-md border border-zinc-200 p-3"
                                key={paymentMethod}
                              >
                                <label
                                  className="flex items-center gap-2 text-sm font-medium text-zinc-700"
                                  htmlFor={`matrix-payment-${paymentMethod}`}
                                >
                                  <Icon
                                    aria-hidden="true"
                                    className="h-4 w-4 text-zinc-500"
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
                    </div>
                    <div className="grid gap-2 lg:grid-cols-[180px_1fr_auto]">
                      <input
                        className={inputClass}
                        disabled={!participants.data?.length}
                        name="customerLabel"
                        placeholder="구매자"
                        type="text"
                      />
                      <input
                        className={inputClass}
                        disabled={!participants.data?.length}
                        name="memo"
                        placeholder="메모"
                        type="text"
                      />
                      <button
                        className={buttonVariants()}
                        disabled={
                          !participants.data?.length ||
                          createReceipt.isPending ||
                          matrixReceiptTotal <= 0 ||
                          (matrixPaymentMode === "split" &&
                            matrixPaymentRemaining !== 0)
                        }
                        type="submit"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </form>
          </section>
        )}

        {view === "receiptLookup" && (
          <section className={panelVariants()}>
                <div
                  className={cn(
                    sectionHeaderClass,
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div>
                    <h2 className={sectionTitleClass}>
                      {selectedMarket?.name ?? "마켓을 불러오는 중입니다"}
                    </h2>
                    <p className={sectionDescriptionClass}>
                      {formatDateRange(
                        selectedMarket?.startsOn ?? null,
                        selectedMarket?.endsOn ?? null,
                      )}
                    </p>
                  </div>
                  <Link
                    className={buttonVariants({ intent: "secondary" })}
                    href="/markets"
                  >
                    마켓 선택
                  </Link>
                </div>
                {participants.isLoading || receipts.isLoading ? (
                  <div className="px-4 py-12 text-center text-sm text-zinc-500">
                    영수증을 불러오는 중입니다.
                  </div>
                ) : (
                  <ReceiptMatrixTable
                    participants={participants.data ?? []}
                    receipts={receipts.data ?? []}
                  />
                )}
          </section>
        )}

        {view === "settlements" && (
          <section className={panelVariants()}>
                <div
                  className={cn(
                    sectionHeaderClass,
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div>
                    <h2 className={sectionTitleClass}>정산 미리보기</h2>
                    <p className={sectionDescriptionClass}>
                      {selectedMarket?.name ?? "마켓 미선택"}
                    </p>
                  </div>
                  <Link
                    className={buttonVariants({ intent: "secondary" })}
                    href="/markets"
                  >
                    마켓 선택
                  </Link>
                </div>
                <SettlementPreviewPanel
                  history={settlementHistory.data ?? []}
                  isConfirming={createSettlementSnapshot.isPending}
                  isDownloading={downloadSettlementPdfArchive.isPending}
                  isHistoryLoading={settlementHistory.isLoading}
                  isLoading={settlementPreview.isLoading}
                  message={settlementMessage}
                  preview={settlementPreview.data ?? null}
                  onConfirm={handleConfirmSettlement}
                  onDownloadPdfs={handleDownloadSettlementPdfs}
                />
          </section>
        )}
      </div>
    </main>
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

function ParticipantMasterManagementHeader({
  isCreating,
  message,
  onSubmit,
}: {
  isCreating: boolean;
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <div
        className={cn(
          sectionHeaderClass,
          "flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between",
        )}
      >
        <div>
          <h2 className={sectionTitleClass}>부스</h2>
          <p className={sectionDescriptionClass}>
            플리마켓에 연결하기 전의 부스 기본 정보를 관리합니다.
          </p>
        </div>
        <form
          className="grid gap-2 xl:grid-cols-[160px_130px_140px_140px_180px_1fr_auto]"
          data-testid="participant-master-form"
          onSubmit={onSubmit}
        >
          <input
            className={inputClass}
            name="displayName"
            placeholder="부스명"
            type="text"
          />
          <select className={selectClass} defaultValue="seller" name="participantType">
            <option value="seller">셀러</option>
            <option value="staff">운영진</option>
            <option value="special_booth">특수 부스</option>
          </select>
          <input
            className={inputClass}
            name="contactName"
            placeholder="담당자"
            type="text"
          />
          <input
            className={inputClass}
            name="phone"
            placeholder="연락처"
            type="tel"
          />
          <input
            className={inputClass}
            name="email"
            placeholder="이메일"
            type="email"
          />
          <input
            className={inputClass}
            name="memo"
            placeholder="메모"
            type="text"
          />
          <button className={buttonVariants()} disabled={isCreating} type="submit">
            추가
          </button>
        </form>
      </div>
      {message && (
        <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
          {message}
        </p>
      )}
    </>
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
          적용 순서: 전체 설정, 플리마켓별 설정, 부스별 설정
        </p>
        <button className={buttonVariants()} disabled={disabled} type="submit">
          {submitLabel}
        </button>
      </div>
      {message && <p className="text-sm font-medium text-zinc-700">{message}</p>}
    </form>
  );
}

function FeeSettingsFields({
  allowInheritance = false,
  defaultValues,
  disabled,
}: {
  allowInheritance?: boolean;
  defaultValues: Partial<SettlementFeeSettings> | null;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        정산 방식
        <select
          className={selectClass}
          defaultValue={defaultValues?.settlementType ?? ""}
          disabled={disabled}
          name="settlementType"
        >
          {allowInheritance && <option value="">상위 설정 사용</option>}
          <option value="commission">수수료</option>
          <option value="manual">수기</option>
          <option value="investment">투자</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        판매 수수료 %
        <input
          className={inputClass}
          defaultValue={formatRateInput(defaultValues?.salesCommissionRate)}
          disabled={disabled}
          min="0"
          name="salesCommissionPercent"
          placeholder={allowInheritance ? "상위 설정 사용" : "0"}
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
          placeholder={allowInheritance ? "상위 설정 사용" : "0"}
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
          {allowInheritance && <option value="">상위 설정 사용</option>}
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
          placeholder={allowInheritance ? "상위 설정 사용" : "0"}
          step="1"
          type="number"
        />
      </label>
    </div>
  );
}

function FeeApplicationMatrix({
  globalSettings,
  isLoading,
  marketSettings,
  participants,
}: {
  globalSettings: SettlementDefaultSettings | null;
  isLoading: boolean;
  marketSettings: SettlementDefaultSettings | null;
  participants: Participant[];
}) {
  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        수수료 적용 현황을 불러오는 중입니다.
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
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
    <div className="overflow-auto border-t border-zinc-200">
      <table className="min-w-[1120px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="sticky left-0 z-20 w-[220px] border-r border-zinc-200 bg-zinc-50 px-4 py-3 font-medium">
              참가부스
            </th>
            <th className="w-[300px] px-4 py-3 font-medium">전체 설정</th>
            <th className="w-[300px] px-4 py-3 font-medium">
              플리마켓 설정
            </th>
            <th className="w-[300px] px-4 py-3 font-medium">부스 설정</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {participants.map((participant) => (
            <tr data-testid="fee-status-row" key={participant.id}>
              <td className="sticky left-0 z-10 border-r border-zinc-200 bg-white px-4 py-4 align-top">
                <p className="font-semibold text-zinc-950">
                  {participant.displayName}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {participantTypeLabels[participant.participantType]}
                </p>
              </td>
              <FeeApplicationCell
                activeCount={countFeeSourceFields(
                  "global",
                  participant,
                  hasMarketSettings,
                )}
                participant={participant}
                scope="global"
                settings={resolvedGlobalSettings}
                title="전체 기본값"
                hasMarketSettings={hasMarketSettings}
              />
              <FeeApplicationCell
                activeCount={countFeeSourceFields(
                  "market",
                  participant,
                  hasMarketSettings,
                )}
                participant={participant}
                scope="market"
                settings={hasMarketSettings ? marketSettings : null}
                title={hasMarketSettings ? "플리마켓 기본값" : "미설정"}
                hasMarketSettings={hasMarketSettings}
              />
              <FeeApplicationCell
                activeCount={countFeeSourceFields(
                  "booth",
                  participant,
                  hasMarketSettings,
                )}
                participant={participant}
                scope="booth"
                settings={participant.settings}
                title="부스별 설정"
                hasMarketSettings={hasMarketSettings}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeeApplicationCell({
  activeCount,
  hasMarketSettings,
  participant,
  scope,
  settings,
  title,
}: {
  activeCount: number;
  hasMarketSettings: boolean;
  participant: Participant;
  scope: FeeSettingScope;
  settings:
    | SettlementDefaultSettings
    | Participant["settings"]
    | null
    | undefined;
  title: string;
}) {
  const isUnavailable = scope === "market" && !hasMarketSettings;

  return (
    <td className="px-4 py-4 align-top">
      <div
        className={cn(
          "grid min-h-[190px] gap-2 rounded-md border border-zinc-200 bg-white p-3",
          activeCount > 0 && "border-emerald-200 bg-emerald-50/40",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-zinc-950">{title}</p>
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-semibold",
              activeCount > 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-zinc-100 text-zinc-500",
            )}
          >
            {activeCount > 0 ? `${activeCount}개 적용` : "대기"}
          </span>
        </div>
        {isUnavailable ? (
          <p className="mt-5 rounded-md bg-zinc-50 px-3 py-4 text-center text-sm text-zinc-500">
            플리마켓 설정이 없어 전체 설정을 사용합니다.
          </p>
        ) : (
          <dl className="grid gap-1.5">
            {feeSettingFields.map((field) => {
              const source = getFeeFieldSource(
                participant,
                field.key,
                hasMarketSettings,
              );
              const isApplied = source === scope;

              return (
                <div
                  className={cn(
                    "grid grid-cols-[92px_minmax(0,1fr)_44px] items-center gap-2 rounded px-2 py-1",
                    isApplied && "bg-white shadow-sm ring-1 ring-emerald-100",
                  )}
                  key={field.key}
                >
                  <dt className="text-xs text-zinc-500">{field.label}</dt>
                  <dd className="truncate font-medium text-zinc-800">
                    {formatFeeFieldValue(
                      field.key,
                      getScopedFeeFieldValue(scope, settings, field.key),
                    )}
                  </dd>
                  <span
                    className={cn(
                      "text-right text-[11px] font-semibold",
                      isApplied ? "text-emerald-700" : "text-zinc-300",
                    )}
                  >
                    {isApplied ? "적용" : "-"}
                  </span>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </td>
  );
}

function MarketDetailPanel({
  market,
  onStatusChange,
}: {
  market: Market | null;
  onStatusChange: (marketId: string, status: MarketStatus) => void;
}) {
  if (!market) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        마켓 정보를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="text-xs font-medium text-zinc-500">마켓명</dt>
          <dd className="mt-1 text-sm font-semibold text-zinc-950">
            {market.name}
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
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:col-span-2 xl:col-span-4">
          <dt className="text-xs font-medium text-zinc-500">메모</dt>
          <dd className="mt-1 text-sm font-medium text-zinc-800">
            {market.description ?? "-"}
          </dd>
        </div>
      </dl>
      <label className="grid content-start gap-2 text-sm font-medium text-zinc-700">
        상태
        <select
          className={selectClass}
          onChange={(event) =>
            onStatusChange(market.id, event.target.value as MarketStatus)
          }
          value={market.status}
        >
          {Object.entries(marketStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function MarketSelectionCards({
  actionLabel = "영수증 목록 보기",
  markets,
  selectedMarketId,
  onSelectMarket,
}: {
  actionLabel?: string;
  markets: Market[];
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string) => void;
}) {
  if (markets.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 마켓이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      {markets.map((market) => {
        const isSelected = selectedMarketId === market.id;

        return (
          <button
            className={cn(
              "group flex min-h-[220px] flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
              isSelected && "border-emerald-400 bg-emerald-50",
            )}
            data-testid="receipt-market-row"
            key={market.id}
            onClick={() => onSelectMarket(market.id)}
            type="button"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-700">
                    플리마켓
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-950">
                    {market.name}
                  </h3>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-semibold",
                    getMarketStatusBadgeClass(market.status),
                  )}
                >
                  {marketStatusLabels[market.status]}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-zinc-500">기간</dt>
                  <dd className="mt-1 font-medium text-zinc-800">
                    {formatDateRange(market.startsOn, market.endsOn)}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">
                      진행일
                    </dt>
                    <dd className="mt-1 font-medium text-zinc-800">
                      {formatMarketDuration(market.startsOn, market.endsOn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">
                      등록일
                    </dt>
                    <dd className="mt-1 font-medium text-zinc-800">
                      {formatDate(market.createdAt)}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500">메모</dt>
                  <dd className="mt-1 line-clamp-2 text-zinc-700">
                    {market.description ?? "-"}
                  </dd>
                </div>
              </dl>
            </div>

            <span
              className={cn(
                "mt-4 inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
                isSelected && "border-emerald-600 bg-emerald-600 text-white",
              )}
            >
              {actionLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ParticipantMasterTable({
  participants,
  linkedParticipantIds = new Set<string>(),
  showLinkStatus = true,
}: {
  participants: Participant[];
  linkedParticipantIds?: Set<string>;
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">부스명</th>
            <th className="px-4 py-3 font-medium">유형</th>
            <th className="px-4 py-3 font-medium">담당자</th>
            <th className="px-4 py-3 font-medium">연락처</th>
            {showLinkStatus && (
              <th className="px-4 py-3 font-medium">선택 마켓</th>
            )}
            <th className="px-4 py-3 font-medium">메모</th>
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
                {participant.phone ?? participant.email ?? "-"}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantList({
  participants,
  selectedParticipantId,
  onSelectParticipant,
  emptyMessage = "등록된 참가부스가 없습니다.",
}: {
  participants: Participant[];
  selectedParticipantId: string | null;
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
      {participants.map((participant) => (
        <button
          className={cn(
            "w-full px-4 py-3 text-left transition hover:bg-emerald-50/50",
            selectedParticipantId === participant.id && "bg-emerald-50",
          )}
          data-testid="participant-row"
          key={participant.id}
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
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
              {formatNullablePercent(participant.settings?.salesCommissionRate)}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-zinc-500">카드 수수료</dt>
              <dd className="mt-1 font-medium text-zinc-800">
                {formatNullablePercent(participant.settings?.cardFeeRate)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">참가비</dt>
              <dd className="mt-1 font-medium text-zinc-800">
                {formatNullableWon(participant.settings?.participationFeeAmount)}
              </dd>
            </div>
          </dl>
        </button>
      ))}
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
    <div className="overflow-x-auto">
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
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        마켓에 연결된 참가부스가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">참가부스</th>
            <th className="px-4 py-3 font-medium">유형</th>
            <th className="px-4 py-3 text-right font-medium">구매 금액</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {participants.map((participant) => (
            <tr key={participant.id}>
              <td className="px-4 py-3 font-medium text-zinc-950">
                {participant.displayName}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {participantTypeLabels[participant.participantType]}
              </td>
              <td className="px-4 py-3">
                <input
                  className={cn(inputClass, "ml-auto max-w-[180px] text-right")}
                  inputMode="numeric"
                  name={`amount-${participant.id}`}
                  onChange={(event) =>
                    onAmountChange(participant.id, event.target.value)
                  }
                  placeholder="0"
                  type="text"
                  value={amounts[participant.id] ?? ""}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
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
    <div className="border-t border-zinc-200">
      <div className="grid h-[calc(100vh-260px)] min-h-[320px] max-h-[720px] overflow-hidden grid-cols-[720px_minmax(0,1fr)] grid-rows-[72px_minmax(0,1fr)]">
        <div
          className="z-20 grid items-center border-b border-r border-zinc-200 bg-zinc-50 text-sm text-zinc-500"
          style={{ gridTemplateColumns: fixedGridTemplate }}
        >
          <div className="px-4 text-center font-medium">판매 시각</div>
          <div className="px-4 text-center font-medium">영수증번호</div>
          <div className="px-4 text-center font-medium">구매자</div>
          <div className="px-4 text-center font-medium">결제</div>
          <div className="px-4 text-center font-medium">합계</div>
        </div>

        <div
          className="scrollbar-hidden min-w-0 overflow-x-auto overflow-y-hidden border-b border-zinc-200 bg-zinc-50"
          data-testid="receipt-booth-header"
          onScroll={handleBoothHeaderScroll}
          ref={boothHeaderRef}
        >
          {participants.length > 0 && (
            <div
              className="grid h-full min-w-max items-center text-sm text-zinc-500"
              style={{ gridTemplateColumns: boothGridTemplate }}
            >
              {participants.map((participant) => (
                <div
                  className="break-keep px-4 text-center font-medium"
                  key={participant.id}
                >
                  {participant.displayName}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="scrollbar-hidden overflow-x-hidden overflow-y-auto border-r border-zinc-200 bg-white"
          data-testid="receipt-fixed-pane"
          onScroll={handleFixedBodyScroll}
          ref={fixedBodyRef}
        >
          <div className="divide-y divide-zinc-100">
            {receipts.map((receipt) => (
              <div
                className="grid h-[88px] items-center text-sm"
                data-testid="receipt-row"
                key={receipt.id}
                style={{ gridTemplateColumns: fixedGridTemplate }}
              >
                <div className="whitespace-nowrap px-4 text-center text-zinc-700">
                  {formatDateTime(receipt.soldAt)}
                </div>
                <div className="truncate px-4 text-center font-medium text-zinc-950">
                  {receipt.receiptNo ?? "-"}
                </div>
                <div className="truncate px-4 text-center font-medium text-zinc-950">
                  {receipt.customerLabel ?? "-"}
                </div>
                <div className="px-4 text-center text-zinc-700">
                  <ReceiptPaymentSplits receipt={receipt} />
                </div>
                <div className="px-4 text-center font-semibold text-zinc-950">
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
            <div className="flex h-full min-h-[248px] items-center justify-center px-4 text-sm text-zinc-500">
              마켓에 연결된 참가부스가 없습니다.
            </div>
          ) : (
            <div className="min-w-max divide-y divide-zinc-100">
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
                        className="px-4 text-center text-zinc-700"
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
              className="h-4 w-4 flex-none text-zinc-500"
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
  isHistoryLoading,
  isConfirming,
  isDownloading,
  message,
  onConfirm,
  onDownloadPdfs,
}: {
  preview: MarketSettlementPreview | null;
  history: SettlementListItem[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  isConfirming: boolean;
  isDownloading: boolean;
  message: string | null;
  onConfirm: (event: FormEvent<HTMLFormElement>) => void;
  onDownloadPdfs: () => void;
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

  return (
    <div>
      <form
        className="grid gap-2 border-b border-zinc-200 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"
        data-testid="settlement-confirm-form"
        onSubmit={onConfirm}
      >
        <input
          className={inputClass}
          disabled={isConfirming || preview.receiptCount === 0}
          name="memo"
          placeholder="확정 메모"
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
          <p className="text-sm font-medium text-zinc-700 md:col-span-3">
            {message}
          </p>
        )}
      </form>
      <dl className="grid gap-px border-b border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-5">
        <SettlementMetric
          label="총매출"
          value={formatWon(preview.netSalesAmount)}
        />
        <SettlementMetric
          label="판매 수수료"
          value={formatWon(preview.salesCommissionAmount)}
        />
        <SettlementMetric
          label="참가부스 부담 카드 수수료"
          value={formatWon(preview.cardFeeChargedToParticipantAmount)}
        />
        <SettlementMetric
          label="마켓 부담 카드 수수료"
          value={formatWon(preview.cardFeePaidByMarketAmount)}
        />
        <SettlementMetric
          label="지급 예정"
          value={formatWon(preview.participantPayoutAmount)}
        />
      </dl>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">참가부스</th>
              <th className="px-4 py-3 text-right font-medium">현금</th>
              <th className="px-4 py-3 text-right font-medium">카드</th>
              <th className="px-4 py-3 text-right font-medium">계좌이체</th>
              <th className="px-4 py-3 text-right font-medium">기타</th>
              <th className="px-4 py-3 text-right font-medium">총매출</th>
              <th className="px-4 py-3 text-right font-medium">판매 수수료</th>
              <th className="px-4 py-3 text-right font-medium">카드 수수료</th>
              <th className="px-4 py-3 text-right font-medium">지급 예정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {preview.participants.map((participant) => (
              <SettlementPreviewRow
                key={participant.participantId}
                participant={participant}
              />
            ))}
          </tbody>
        </table>
      </div>
      <SettlementHistoryPanel history={history} isLoading={isHistoryLoading} />
    </div>
  );
}

function SettlementHistoryPanel({
  history,
  isLoading,
}: {
  history: SettlementListItem[];
  isLoading: boolean;
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">회차</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">확정 시각</th>
              <th className="px-4 py-3 text-right font-medium">총매출</th>
              <th className="px-4 py-3 text-right font-medium">지급 예정</th>
              <th className="px-4 py-3 text-right font-medium">마켓 손익</th>
              <th className="px-4 py-3 font-medium">메모</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettlementMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}

function SettlementPreviewRow({
  participant,
}: {
  participant: ParticipantSettlementPreview;
}) {
  return (
    <tr data-testid="settlement-row">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-950">{participant.displayName}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {participantTypeLabels[participant.participantType]} ·{" "}
          {settlementTypeLabels[participant.settlementType]} ·{" "}
          {participant.saleLineCount}건
        </p>
      </td>
      <td className="px-4 py-3 text-right text-zinc-700">
        {formatWon(participant.cashSalesAmount)}
      </td>
      <td className="px-4 py-3 text-right text-zinc-700">
        {formatWon(participant.cardSalesAmount)}
      </td>
      <td className="px-4 py-3 text-right text-zinc-700">
        {formatWon(participant.transferSalesAmount)}
      </td>
      <td className="px-4 py-3 text-right text-zinc-700">
        {formatWon(participant.otherSalesAmount)}
      </td>
      <td className="px-4 py-3 text-right font-medium text-zinc-950">
        {formatWon(participant.netSalesAmount)}
      </td>
      <td className="px-4 py-3 text-right text-zinc-700">
        {formatWon(participant.salesCommissionAmount)}
        <span className="ml-1 text-xs text-zinc-400">
          {formatPercent(participant.salesCommissionRate)}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-zinc-700">
        {formatWon(participant.cardFeeAmount)}
        <span className="ml-1 text-xs text-zinc-400">
          {participant.cardFeePayer === "participant" ? "참가부스" : "마켓"}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-semibold text-zinc-950">
        {formatWon(participant.payoutAmount)}
      </td>
    </tr>
  );
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getOptionalFormString(
  formData: FormData,
  name: string,
): string | undefined {
  const value = getFormString(formData, name).trim();
  return value || undefined;
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

function countFeeSourceFields(
  scope: FeeSettingScope,
  participant: Participant,
  hasMarketSettings: boolean,
): number {
  return feeSettingFields.filter(
    (field) => getFeeFieldSource(participant, field.key, hasMarketSettings) === scope,
  ).length;
}

function getFeeFieldSource(
  participant: Participant,
  field: FeeSettingFieldKey,
  hasMarketSettings: boolean,
): FeeSettingScope {
  const boothValue = participant.settings?.[field];

  if (boothValue !== null && boothValue !== undefined) {
    return "booth";
  }

  return hasMarketSettings ? "market" : "global";
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
): string {
  if (value === null || value === undefined) {
    return "상위 설정";
  }

  switch (field) {
    case "settlementType":
      return settlementTypeLabels[value as SettlementType];
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
    settlementType: getFormString(formData, "settlementType") as SettlementType,
    salesCommissionRate: getPercentRate(formData, "salesCommissionPercent") ?? 0,
    cardFeeRate: getPercentRate(formData, "cardFeePercent") ?? 0,
    cardFeePayer: getFormString(formData, "cardFeePayer") as CardFeePayer,
    participationFeeAmount: getNumber(formData, "participationFeeAmount") ?? 0,
  };
}

function getOptionalFeeSettingsPayload(
  formData: FormData,
): UpdateSettlementFeeSettingsPayload {
  const settlementType = getOptionalFormString(
    formData,
    "settlementType",
  ) as SettlementType | undefined;
  const salesCommissionRate = getPercentRate(
    formData,
    "salesCommissionPercent",
  );
  const cardFeeRate = getPercentRate(formData, "cardFeePercent");
  const cardFeePayer = getOptionalFormString(
    formData,
    "cardFeePayer",
  ) as CardFeePayer | undefined;
  const participationFeeAmount = getNumber(formData, "participationFeeAmount");

  return {
    ...(settlementType ? { settlementType } : {}),
    ...(salesCommissionRate !== undefined ? { salesCommissionRate } : {}),
    ...(cardFeeRate !== undefined ? { cardFeeRate } : {}),
    ...(cardFeePayer ? { cardFeePayer } : {}),
    ...(participationFeeAmount !== undefined ? { participationFeeAmount } : {}),
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
}: {
  customerLabel?: string;
  memo?: string;
  paymentMethod: PaymentMethod | "";
  paymentSplits?: CreateReceiptPaymentSplitPayload[];
  saleLines: ReceiptLineDraft[];
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
  };
}

function parseReceiptAmountInput(value: string): number | null {
  const amount = parseMoneyInputAmount(value);

  if (amount === null) {
    return null;
  }

  if (amount <= 0) {
    throw new Error("금액은 0보다 큰 원 단위 숫자로 입력해주세요.");
  }

  return amount;
}

function parseOptionalReceiptAmount(value: string): number | null {
  try {
    return parseReceiptAmountInput(value);
  } catch {
    return null;
  }
}

function sumReceiptAmounts(amounts: Record<string, string>): number {
  return Object.values(amounts).reduce(
    (sum, value) => sum + (parseOptionalReceiptAmount(value) ?? 0),
    0,
  );
}

function parseMoneyInputAmount(value: string): number | null {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : null;
}

function formatMoneyInput(value: string): string {
  const amount = parseMoneyInputAmount(value);
  return amount === null ? "" : formatMoneyAmount(amount);
}

function formatMoneyAmount(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getEmptyPaymentSplitAmounts(): Record<PaymentMethod, string> {
  return {
    cash: "",
    card: "",
    transfer: "",
    other: "",
  };
}

function clampPaymentSplitAmounts(
  amounts: Record<PaymentMethod, string>,
  totalAmount: number,
): Record<PaymentMethod, string> {
  const clampedAmounts = getEmptyPaymentSplitAmounts();
  let usedAmount = 0;

  for (const paymentMethod of paymentMethods) {
    const amount = parseOptionalReceiptAmount(amounts[paymentMethod]) ?? 0;
    const allowedAmount = Math.max(totalAmount - usedAmount, 0);
    const clampedAmount = Math.min(amount, allowedAmount);

    if (clampedAmount > 0) {
      clampedAmounts[paymentMethod] = formatMoneyAmount(clampedAmount);
      usedAmount += clampedAmount;
    }
  }

  return clampedAmounts;
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

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace(/\\.00$/, "")}%`;
}

function formatNullablePercent(value: number | null | undefined): string {
  return value === null || value === undefined ? "상위 설정" : formatPercent(value);
}

function formatNullableWon(value: number | null | undefined): string {
  return value === null || value === undefined ? "상위 설정" : formatWon(value);
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
