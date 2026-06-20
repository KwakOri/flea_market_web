"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useMarkets } from "@/hooks/use-markets";
import {
  useCreateParticipant,
  useDeleteParticipantFromMarket,
  useParticipantMasters,
  useParticipants,
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
  useSettlementPreview,
  useSettlements,
} from "@/hooks/use-settlement-preview";
import {
  useGlobalSettlementSettings,
  useMarketSettlementSettings,
} from "@/hooks/use-settlement-settings";
import type {
  Participant,
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
import { HomeView } from "@/features/dashboard/components/home-view";
import { PageStateMessage } from "@/features/dashboard/components/page-state-message";
import { SettingsScreen } from "@/features/fees/components/settings-screen";
import { FeeStatusView } from "@/features/fees/components/fee-status-view";
import { getFeeSettingsPayload } from "@/features/fees/lib/fee-settings-payload";
import { ParticipantDialog } from "@/features/participants/components/participant-dialogs";
import { MarketManagementScreen } from "@/features/markets/components/market-management-screen";
import { marketStatusLabels } from "@/features/markets/lib/market-display";
import { BoothProductManagementView } from "@/features/participants/components/booth-product-management-view";
import { BoothMasterManagementScreen } from "@/features/participants/components/booth-master-management-screen";
import { ReceiptLookupView } from "@/features/receipts/components/receipt-lookup-view";
import { SalesMatrixView } from "@/features/receipts/components/sales-matrix-view";
import {
  buildReceiptSoldAtFromDateTimeInput,
  getDefaultReceiptDateTimeInputValue,
} from "@/features/receipts/lib/receipt-date-time";
import { SettlementScreen } from "@/features/settlements/components/settlement-screen";
import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { formatDateRange } from "@/lib/date-format";
import { getErrorMessage } from "@/lib/error-message";
import {
  getCheckboxValue,
  getFormString,
  getOptionalFormString,
  getRequiredNumber,
} from "@/lib/form-data";
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
  const [participantMessage, setParticipantMessage] = useState<string | null>(
    null,
  );
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
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
  const participantFeeOverrideEnabled = useDashboardDialogStore(
    (state) => state.participantFeeOverrideEnabled,
  );
  const participantDialogMode = useDashboardDialogStore(
    (state) => state.participantDialogMode,
  );
  const editingParticipantId = useDashboardDialogStore(
    (state) => state.editingParticipantId,
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
  const setParticipantFeeOverrideEnabled = useDashboardDialogStore(
    (state) => state.setParticipantFeeOverrideEnabled,
  );
  const currentUser = useCurrentUser();
  const user = currentUser.data ?? null;
  const markets = useMarkets(Boolean(user));
  const selectedMarketId = marketId ?? null;
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
  const globalFeeSettings = useGlobalSettlementSettings(Boolean(user));
  const marketFeeSettings = useMarketSettlementSettings(selectedMarketId);
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
  const editingParticipant = useMemo(
    () =>
      participants.data?.find(
        (participant) => participant.id === editingParticipantId,
      ) ?? null,
    [editingParticipantId, participants.data],
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
          <SettlementScreen
            market={selectedMarket}
            marketId={selectedMarketId}
            selectedParticipantId={settlementParticipantId ?? null}
            onSaved={showToast}
          />
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
