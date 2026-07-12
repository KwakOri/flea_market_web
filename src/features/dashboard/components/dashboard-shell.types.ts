import {
  FLEA_MARKET_MANAGE_LABEL,
  PARTICIPATING_SELLER,
  SELLER_MANAGE_LABEL,
} from "@/lib/terminology";

export type DashboardView =
  | "home"
  | "settings"
  | "users"
  | "management"
  | "boothMasters"
  | "booths"
  | "feeStatus"
  | "salesMatrix"
  | "receiptLookup"
  | "receiptEdit"
  | "settlements"
  | "logs";

export type DashboardSummaryItem = {
  accent: boolean;
  label: string;
  value: string;
};

export const dashboardViewLabels: Record<DashboardView, string> = {
  home: "관리 홈",
  settings: "설정",
  users: "사용자 관리",
  management: FLEA_MARKET_MANAGE_LABEL,
  boothMasters: SELLER_MANAGE_LABEL,
  booths: `${PARTICIPATING_SELLER} 관리`,
  feeStatus: "수수료 현황",
  salesMatrix: "영수증 입력",
  receiptLookup: "영수증 조회",
  receiptEdit: "영수증 수정",
  settlements: "정산",
  logs: "LOG",
};
