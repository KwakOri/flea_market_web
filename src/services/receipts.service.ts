import { apiRequest } from "./api-client";

export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export type ReceiptPaymentSplit = {
  id: string;
  receiptId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaleLineItem = {
  id: string;
  saleLineId: string;
  productId: string | null;
  itemName: string;
  quantity: number;
  unitPriceAmount: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaleLine = {
  id: string;
  receiptId: string;
  participantId: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  memo: string | null;
  items: SaleLineItem[];
  createdAt: string;
  updatedAt: string;
};

export type Receipt = {
  id: string;
  marketId: string;
  marketDayId: string | null;
  receiptNo: string | null;
  customerLabel: string | null;
  soldAt: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  memo: string | null;
  createdBy: string | null;
  paymentSplits: ReceiptPaymentSplit[];
  saleLines: SaleLine[];
  createdAt: string;
  updatedAt: string;
};

export type CreateReceiptPaymentSplitPayload = {
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNo?: string;
};

export type CreateSaleLineItemPayload = {
  productId?: string;
  itemName: string;
  quantity?: number;
  unitPriceAmount: number;
  discountAmount?: number;
  memo?: string;
};

export type CreateSaleLinePayload = {
  participantId: string;
  items: CreateSaleLineItemPayload[];
  memo?: string;
};

export type CreateReceiptPayload = {
  marketDayId?: string;
  receiptNo?: string;
  customerLabel?: string;
  soldAt?: string;
  memo?: string;
  paymentSplits: CreateReceiptPaymentSplitPayload[];
  saleLines: CreateSaleLinePayload[];
};

export type UpdateReceiptPayload = Partial<CreateReceiptPayload>;

export async function listReceipts(marketId: string): Promise<Receipt[]> {
  return apiRequest<Receipt[]>(`/markets/${marketId}/receipts`);
}

export async function createReceipt(
  marketId: string,
  payload: CreateReceiptPayload,
): Promise<Receipt> {
  return apiRequest<Receipt>(`/markets/${marketId}/receipts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getReceipt(receiptId: string): Promise<Receipt> {
  return apiRequest<Receipt>(`/receipts/${receiptId}`);
}

export async function updateReceipt(
  receiptId: string,
  payload: UpdateReceiptPayload,
): Promise<Receipt> {
  return apiRequest<Receipt>(`/receipts/${receiptId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
