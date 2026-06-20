import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import type { PaymentMethod } from "@/services/receipts.service";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "현금",
  card: "카드",
  transfer: "계좌이체",
  other: "기타",
};

export const paymentMethodIcons: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
  other: CircleDollarSign,
};
