import type { SettlementStatus } from "@/services/settlements.service";

export const settlementStatusLabels: Record<SettlementStatus, string> = {
  confirmed: "확정",
  superseded: "이전 회차",
  voided: "무효",
};
