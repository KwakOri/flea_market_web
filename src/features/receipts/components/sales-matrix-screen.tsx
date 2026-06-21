"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParticipants } from "@/hooks/use-participants";
import { useCreateReceipt } from "@/hooks/use-receipts";
import type { Market } from "@/services/markets.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { SalesMatrixView } from "@/features/receipts/components/sales-matrix-view";
import {
  buildReceiptSoldAtFromDateTimeInput,
  getDefaultReceiptDateTimeInputValue,
} from "@/features/receipts/lib/receipt-date-time";
import {
  buildReceiptPayload,
  getPaymentSplitsFromAmounts,
  getReceiptLinesFromAmounts,
} from "@/features/receipts/lib/receipt-payload";
import { getErrorMessage } from "@/lib/error-message";
import { getOptionalFormString } from "@/lib/form-data";
import { formatWon } from "@/lib/money";

export function SalesMatrixScreen({
  market,
  marketId,
  onSaved,
}: {
  market: Market | null;
  marketId: string | null;
  onSaved: (title: string, message: string) => void;
}) {
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const participants = useParticipants(marketId);
  const createReceipt = useCreateReceipt(marketId);
  const resetMatrixReceiptDraft = useReceiptMatrixStore(
    (state) => state.resetReceiptDraft,
  );

  useEffect(() => {
    resetMatrixReceiptDraft();
  }, [marketId, resetMatrixReceiptDraft]);

  async function handleCreateMatrixReceipt(event: FormEvent<HTMLFormElement>) {
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
      onSaved(
        "영수증 저장 완료",
        `${formatWon(receipt.totalAmount)} 영수증을 저장했습니다.`,
      );
    } catch (error) {
      setReceiptMessage(getErrorMessage(error));
    }
  }

  return (
    <SalesMatrixView
      isSubmitting={createReceipt.isPending}
      participants={participants.data ?? []}
      receiptMessage={receiptMessage}
      selectedMarket={market}
      selectedMarketId={marketId}
      onSubmit={handleCreateMatrixReceipt}
    />
  );
}
