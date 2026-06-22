import { create } from "zustand";
import type { PaymentMethod } from "@/services/receipts.service";
import { formatMoneyAmount, formatMoneyInput } from "@/lib/money";
import {
  clampPaymentSplitAmounts,
  getEmptyPaymentSplitAmounts,
  parseOptionalReceiptAmount,
  paymentMethods,
  sumReceiptAmounts,
  type ReceiptAmountDrafts,
  type ReceiptDateTimeDraft,
  type ReceiptPaymentMode,
  type ReceiptPaymentSplitDrafts,
} from "@/lib/receipt-matrix";

type ReceiptMatrixState = {
  receiptAmounts: ReceiptAmountDrafts;
  receiptDateTimeDraft: ReceiptDateTimeDraft;
  paymentMode: ReceiptPaymentMode;
  singlePaymentMethod: PaymentMethod;
  paymentSplits: ReceiptPaymentSplitDrafts;
  clearReceiptDateTimeDraft: () => void;
  fillPaymentSplitRemaining: (paymentMethod: PaymentMethod) => void;
  resetReceiptDraft: () => void;
  setPaymentMode: (paymentMode: ReceiptPaymentMode) => void;
  setPaymentSplit: (paymentMethod: PaymentMethod, amount: string) => void;
  setReceiptDraft: (draft: {
    paymentMode: ReceiptPaymentMode;
    paymentSplits: ReceiptPaymentSplitDrafts;
    receiptAmounts: ReceiptAmountDrafts;
    receiptDateTimeDraft: ReceiptDateTimeDraft;
    singlePaymentMethod: PaymentMethod;
  }) => void;
  setReceiptAmount: (participantId: string, amount: string) => void;
  setReceiptDateTimeDraft: (draft: ReceiptDateTimeDraft) => void;
  setSinglePaymentMethod: (paymentMethod: PaymentMethod) => void;
};

export const useReceiptMatrixStore = create<ReceiptMatrixState>((set) => ({
  receiptAmounts: {},
  receiptDateTimeDraft: null,
  paymentMode: "single",
  singlePaymentMethod: "cash",
  paymentSplits: getEmptyPaymentSplitAmounts(),
  clearReceiptDateTimeDraft: () => set({ receiptDateTimeDraft: null }),
  fillPaymentSplitRemaining: (paymentMethod) =>
    set((state) => {
      const receiptTotal = sumReceiptAmounts(state.receiptAmounts);
      const otherTotal = paymentMethods.reduce(
        (sum, currentPaymentMethod) =>
          currentPaymentMethod === paymentMethod
            ? sum
            : sum +
              (parseOptionalReceiptAmount(
                state.paymentSplits[currentPaymentMethod],
              ) ?? 0),
        0,
      );
      const remainingAmount = Math.max(receiptTotal - otherTotal, 0);

      return {
        paymentSplits: {
          ...state.paymentSplits,
          [paymentMethod]:
            remainingAmount > 0 ? formatMoneyAmount(remainingAmount) : "",
        },
      };
    }),
  resetReceiptDraft: () =>
    set({
      receiptAmounts: {},
      receiptDateTimeDraft: null,
      paymentSplits: getEmptyPaymentSplitAmounts(),
    }),
  setPaymentMode: (paymentMode) =>
    set({
      paymentMode,
      paymentSplits: getEmptyPaymentSplitAmounts(),
    }),
  setPaymentSplit: (paymentMethod, amount) =>
    set((state) => {
      const nextAmount = parseOptionalReceiptAmount(amount) ?? 0;
      const receiptTotal = sumReceiptAmounts(state.receiptAmounts);
      const otherTotal = paymentMethods.reduce(
        (sum, currentPaymentMethod) =>
          currentPaymentMethod === paymentMethod
            ? sum
            : sum +
              (parseOptionalReceiptAmount(
                state.paymentSplits[currentPaymentMethod],
              ) ?? 0),
        0,
      );
      const allowedAmount = Math.max(receiptTotal - otherTotal, 0);
      const clampedAmount = Math.min(nextAmount, allowedAmount);

      return {
        paymentSplits: {
          ...state.paymentSplits,
          [paymentMethod]:
            clampedAmount > 0 ? formatMoneyAmount(clampedAmount) : "",
        },
      };
    }),
  setReceiptDraft: (draft) => set(draft),
  setReceiptAmount: (participantId, amount) =>
    set((state) => {
      const receiptAmounts = {
        ...state.receiptAmounts,
        [participantId]: formatMoneyInput(amount),
      };
      const receiptTotal = sumReceiptAmounts(receiptAmounts);

      return {
        receiptAmounts,
        paymentSplits: clampPaymentSplitAmounts(
          state.paymentSplits,
          receiptTotal,
        ),
      };
    }),
  setReceiptDateTimeDraft: (draft) => set({ receiptDateTimeDraft: draft }),
  setSinglePaymentMethod: (paymentMethod) =>
    set({ singlePaymentMethod: paymentMethod }),
}));
