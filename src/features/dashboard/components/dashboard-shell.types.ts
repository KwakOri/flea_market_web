export type DashboardView =
  | "home"
  | "settings"
  | "management"
  | "boothMasters"
  | "booths"
  | "feeStatus"
  | "salesMatrix"
  | "receiptLookup"
  | "settlements";

export type DashboardSummaryItem = {
  accent: boolean;
  label: string;
  value: string;
};

export const dashboardViewLabels: Record<DashboardView, string> = {
  home: "관리 홈",
  settings: "설정",
  management: "마켓관리",
  boothMasters: "부스관리",
  booths: "참가부스관리",
  feeStatus: "수수료 현황",
  salesMatrix: "영수증 입력",
  receiptLookup: "영수증 조회",
  settlements: "정산",
};
