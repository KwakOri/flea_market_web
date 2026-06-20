"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParticipants } from "@/hooks/use-participants";
import { useCreateReceipt } from "@/hooks/use-receipts";
import type { Market } from "@/services/markets.service";
import type { Participant } from "@/services/participants.service";
import type {
  CreateReceiptPayload,
  CreateReceiptPaymentSplitPayload,
  PaymentMethod,
} from "@/services/receipts.service";
import { useReceiptMatrixStore } from "@/stores/receipt-matrix.store";
import { SalesMatrixView } from "@/features/receipts/components/sales-matrix-view";
import {
  buildReceiptSoldAtFromDateTimeInput,
  getDefaultReceiptDateTimeInputValue,
} from "@/features/receipts/lib/receipt-date-time";
import { getErrorMessage } from "@/lib/error-message";
import { getOptionalFormString } from "@/lib/form-data";
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
