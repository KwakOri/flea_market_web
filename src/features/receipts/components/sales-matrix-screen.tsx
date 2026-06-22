"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useParticipants } from "@/hooks/use-participants";
import {
  useCreateReceipt,
  useReceipt,
  useUpdateReceipt,
} from "@/hooks/use-receipts";
import type { Market } from "@/services/markets.service";
import type { PaymentMethod, Receipt } from "@/services/receipts.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { PageStateMessage } from "@/features/dashboard/components/page-state-message";
import { SalesMatrixView } from "@/features/receipts/components/sales-matrix-view";
import {
  buildReceiptSoldAtFromDateTimeInput,
  getDefaultReceiptDateTimeInputValue,
  getReceiptDateTimeInputValue,
} from "@/features/receipts/lib/receipt-date-time";
import {
  buildReceiptPayload,
  getPaymentSplitsFromAmounts,
  getReceiptLinesFromAmounts,
} from "@/features/receipts/lib/receipt-payload";
import { getErrorMessage } from "@/lib/error-message";
import { getOptionalFormString } from "@/lib/form-data";
import { formatMoneyAmount, formatWon } from "@/lib/money";
import {
  getEmptyPaymentSplitAmounts,
  paymentMethods,
  type ReceiptAmountDrafts,
  type ReceiptDateTimeDraft,
  type ReceiptPaymentMode,
  type ReceiptPaymentSplitDrafts,
} from "@/lib/receipt-matrix";

export function SalesMatrixScreen({
  market,
  marketId,
  mode = "create",
  onSaved,
  receiptId = null,
}: {
  market: Market | null;
  marketId: string | null;
  mode?: "create" | "edit";
  onSaved: (title: string, message: string) => void;
  receiptId?: string | null;
}) {
  const router = useRouter();
  const isEditing = mode === "edit";
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const hydratedReceiptKeyRef = useRef<string | null>(null);
  const participants = useParticipants(marketId);
  const createReceipt = useCreateReceipt(marketId);
  const updateReceipt = useUpdateReceipt(marketId);
  const receipt = useReceipt(isEditing ? receiptId : null);
  const resetMatrixReceiptDraft = useReceiptMatrixStore(
    (state) => state.resetReceiptDraft,
  );
  const setReceiptDraft = useReceiptMatrixStore((state) => state.setReceiptDraft);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    hydratedReceiptKeyRef.current = null;
    resetMatrixReceiptDraft();
  }, [isEditing, marketId, resetMatrixReceiptDraft]);

  useEffect(() => {
    if (!isEditing || !receipt.data) {
      return;
    }

    const hydrationKey = `${receipt.data.id}:${receipt.data.updatedAt}`;

    if (hydratedReceiptKeyRef.current === hydrationKey) {
      return;
    }

    setReceiptDraft(buildReceiptDraft(receipt.data, marketId));
    hydratedReceiptKeyRef.current = hydrationKey;
  }, [isEditing, marketId, receipt.data, setReceiptDraft]);

  async function handleSubmitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReceiptMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const receiptMatrixState = useReceiptMatrixStore.getState();
      const receiptDateTimeEnabled =
        receiptMatrixState.receiptDateTimeDraft?.marketId === marketId &&
        receiptMatrixState.receiptDateTimeDraft.enabled;
      const receiptDateTimeValue =
        receiptDateTimeEnabled && receiptMatrixState.receiptDateTimeDraft?.value
          ? receiptMatrixState.receiptDateTimeDraft.value
          : getDefaultReceiptDateTimeInputValue(
              market?.startsOn ?? null,
              market?.endsOn ?? null,
            );
      const soldAt = receiptDateTimeEnabled
        ? buildReceiptSoldAtFromDateTimeInput(
            receiptDateTimeValue,
            market?.startsOn ?? null,
            market?.endsOn ?? null,
          )
        : new Date().toISOString();
      const saleLines = getReceiptLinesFromAmounts(
        receiptMatrixState.receiptAmounts,
        participants.data ?? [],
      );

      const payload = buildReceiptPayload({
        memo: getOptionalFormString(formData, "memo"),
        paymentMethod:
          receiptMatrixState.paymentMode === "single"
            ? receiptMatrixState.singlePaymentMethod
            : "",
        paymentSplits:
          receiptMatrixState.paymentMode === "split"
            ? getPaymentSplitsFromAmounts(receiptMatrixState.paymentSplits)
            : undefined,
        receiptNo: getOptionalFormString(formData, "receiptNo"),
        saleLines,
        soldAt,
      });

      if (isEditing) {
        if (!receiptId) {
          throw new Error("수정할 영수증을 찾지 못했습니다.");
        }

        const updatedReceipt = await updateReceipt.mutateAsync({
          receiptId,
          payload,
        });

        resetMatrixReceiptDraft();
        onSaved(
          "영수증 수정 완료",
          `${formatWon(updatedReceipt.totalAmount)} 영수증을 수정했습니다.`,
        );
        router.push(`/markets/${updatedReceipt.marketId}/receipts`);
        return;
      }

      const createdReceipt = await createReceipt.mutateAsync(payload);

      resetMatrixReceiptDraft();
      form.reset();
      onSaved(
        "영수증 저장 완료",
        `${formatWon(createdReceipt.totalAmount)} 영수증을 저장했습니다.`,
      );
    } catch (error) {
      setReceiptMessage(getErrorMessage(error));
    }
  }

  if (isEditing && !receiptId) {
    return <PageStateMessage message="수정할 영수증을 찾지 못했습니다." />;
  }

  if (isEditing && receipt.isLoading) {
    return <PageStateMessage message="영수증을 불러오는 중입니다." />;
  }

  if (isEditing && receipt.isError) {
    return <PageStateMessage message="영수증을 불러오지 못했습니다." />;
  }

  return (
    <SalesMatrixView
      formKey={isEditing ? receipt.data?.id : undefined}
      isSubmitting={createReceipt.isPending || updateReceipt.isPending}
      memoDefaultValue={receipt.data?.memo ?? undefined}
      mode={mode}
      participants={participants.data ?? []}
      receiptNoDefaultValue={receipt.data?.receiptNo ?? undefined}
      receiptMessage={receiptMessage}
      selectedMarket={market}
      selectedMarketId={marketId}
      onSubmit={handleSubmitReceipt}
    />
  );
}

function buildReceiptDraft(
  receipt: Receipt,
  marketId: string | null,
): {
  paymentMode: ReceiptPaymentMode;
  paymentSplits: ReceiptPaymentSplitDrafts;
  receiptAmounts: ReceiptAmountDrafts;
  receiptDateTimeDraft: ReceiptDateTimeDraft;
  singlePaymentMethod: PaymentMethod;
} {
  const receiptAmounts: ReceiptAmountDrafts = {};
  const saleLineAmounts = new Map<string, number>();
  const paymentSplitAmounts = new Map(
    paymentMethods.map((method) => [method, 0]),
  );
  const paymentSplits: ReceiptPaymentSplitDrafts = getEmptyPaymentSplitAmounts();
  const singlePaymentMethod = receipt.paymentSplits[0]?.paymentMethod ?? "cash";
  const paymentMode = receipt.paymentSplits.length <= 1 ? "single" : "split";

  for (const saleLine of receipt.saleLines) {
    saleLineAmounts.set(
      saleLine.participantId,
      (saleLineAmounts.get(saleLine.participantId) ?? 0) + saleLine.netAmount,
    );
  }

  for (const [participantId, amount] of saleLineAmounts.entries()) {
    receiptAmounts[participantId] = formatMoneyAmount(amount);
  }

  for (const paymentSplit of receipt.paymentSplits) {
    paymentSplitAmounts.set(
      paymentSplit.paymentMethod,
      (paymentSplitAmounts.get(paymentSplit.paymentMethod) ?? 0) +
        paymentSplit.amount,
    );
  }

  for (const paymentMethod of paymentMethods) {
    const amount = paymentSplitAmounts.get(paymentMethod) ?? 0;
    paymentSplits[paymentMethod] = amount > 0 ? formatMoneyAmount(amount) : "";
  }

  return {
    paymentMode,
    paymentSplits,
    receiptAmounts,
    receiptDateTimeDraft: {
      enabled: true,
      marketId: marketId ?? receipt.marketId,
      value: getReceiptDateTimeInputValue(receipt.soldAt),
    },
    singlePaymentMethod,
  };
}
