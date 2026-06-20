import type { PaymentMethod } from "@/services/receipts.service";
import { formatMoneyAmount, parseMoneyInputAmount } from "@/lib/money";

export type ReceiptPaymentMode = "single" | "split";

export type ReceiptDateTimeDraft = {
  enabled: boolean;
  marketId: string | null;
  value: string;
} | null;

export type ReceiptAmountDrafts = Record<string, string>;
export type ReceiptPaymentSplitDrafts = Record<PaymentMethod, string>;

export const paymentMethods: PaymentMethod[] = [
  "cash",
  "card",
  "transfer",
  "other",
];

export function parseReceiptAmountInput(value: string): number | null {
  const amount = parseMoneyInputAmount(value);

  if (amount === null) {
    return null;
  }

  if (amount <= 0) {
    throw new Error("금액은 0보다 큰 원 단위 숫자로 입력해주세요.");
  }

  return amount;
}

export function parseOptionalReceiptAmount(value: string): number | null {
  try {
    return parseReceiptAmountInput(value);
  } catch {
    return null;
  }
}

export function sumReceiptAmounts(amounts: Record<string, string>): number {
  return Object.values(amounts).reduce(
    (sum, value) => sum + (parseOptionalReceiptAmount(value) ?? 0),
    0,
  );
}

export function getEmptyPaymentSplitAmounts(): ReceiptPaymentSplitDrafts {
  return {
    cash: "",
    card: "",
    transfer: "",
    other: "",
  };
}

export function clampPaymentSplitAmounts(
  amounts: ReceiptPaymentSplitDrafts,
  totalAmount: number,
): ReceiptPaymentSplitDrafts {
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
