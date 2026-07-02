import type { Participant } from "@/services/participants.service";
import type {
  CreateReceiptPayload,
  CreateReceiptPaymentSplitPayload,
  PaymentMethod,
} from "@/services/receipts.service";
import { SELLER } from "@/lib/terminology";
import {
  parseReceiptAmountInput,
  paymentMethods,
} from "@/lib/receipt-matrix";

type ReceiptLineDraft = {
  participantId: string;
  participantName: string;
  amount: number;
};

export function getReceiptLinesFromAmounts(
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

export function getPaymentSplitsFromAmounts(
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

export function buildReceiptPayload({
  memo,
  paymentMethod,
  paymentSplits,
  receiptNo,
  saleLines,
  soldAt,
}: {
  memo?: string;
  paymentMethod: PaymentMethod | "";
  paymentSplits?: CreateReceiptPaymentSplitPayload[];
  receiptNo?: string;
  saleLines: ReceiptLineDraft[];
  soldAt?: string;
}): CreateReceiptPayload {
  const normalizedReceiptNo = receiptNo?.trim();

  if (!normalizedReceiptNo) {
    throw new Error("영수증 번호를 입력해주세요.");
  }

  if (saleLines.length === 0) {
    throw new Error(`${SELLER}별 구매 금액을 하나 이상 입력해주세요.`);
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
    memo,
    paymentSplits: receiptPaymentSplits,
    receiptNo: normalizedReceiptNo,
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
