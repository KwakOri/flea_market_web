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
      return "bg-emerald-100 text-emerald-800";
    case "superseded":
      return "bg-zinc-100 text-zinc-700";
    case "voided":
    default:
      return "bg-red-100 text-red-800";
  }
}
