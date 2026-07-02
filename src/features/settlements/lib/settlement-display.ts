import type { SettlementStatus } from "@/services/settlements.service";

export const settlementStatusLabels: Record<SettlementStatus, string> = {
  confirmed: "확정",
  superseded: "이전 회차",
  voided: "무효",
};

export function getSettlementStatusBadgeClass(
  status: SettlementStatus,
): string {
  switch (status) {
    case "confirmed":
      return "bg-success-tint text-success";
    case "superseded":
      return "bg-canvas-soft text-muted";
    case "voided":
    default:
      return "bg-error-tint text-error";
  }
}
