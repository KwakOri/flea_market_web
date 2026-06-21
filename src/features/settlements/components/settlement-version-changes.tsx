import type {
  SettlementAmountDeltas,
  SettlementChange,
  SettlementChangeType,
} from "@/services/settlements.service";
import { formatFullDateTime } from "@/lib/date-format";
import { formatWon } from "@/lib/money";
import {
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

type AmountDeltaKey = keyof SettlementAmountDeltas;

const settlementChangeTypeLabels: Record<SettlementChangeType, string> = {
  initial_confirmation: "최초 확정",
  revision_confirmation: "수정 정산",
  manual_note: "수기 메모",
};

const amountDeltaFields: Array<{
  key: AmountDeltaKey;
  label: string;
}> = [
  { key: "grossSalesAmount", label: "총 판매액" },
  { key: "discountAmount", label: "할인" },
  { key: "netSalesAmount", label: "총매출" },
  { key: "cashSalesAmount", label: "현금 매출" },
  { key: "cardSalesAmount", label: "카드 매출" },
  { key: "transferSalesAmount", label: "계좌이체 매출" },
  { key: "otherSalesAmount", label: "기타 매출" },
  { key: "salesCommissionAmount", label: "판매 수수료" },
  { key: "cardFeeAmount", label: "카드 수수료" },
  {
    key: "cardFeeChargedToParticipantAmount",
    label: "참가부스 부담 카드 수수료",
  },
  { key: "cardFeePaidByMarketAmount", label: "마켓 부담 카드 수수료" },
  { key: "participationFeeAmount", label: "참가비" },
  { key: "marketIncomeAmount", label: "마켓 수입" },
  { key: "marketCostAmount", label: "마켓 비용" },
  { key: "marketProfitAmount", label: "마켓 손익" },
  { key: "participantPayoutAmount", label: "지급 예정" },
];

export function SettlementChanges({ changes }: { changes: SettlementChange[] }) {
  return (
    <section className={panelVariants()}>
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>변경 내역</h2>
        <p className={sectionDescriptionClass}>
          회차 생성 시 저장된 변경 사유와 금액 변화입니다.
        </p>
      </div>
      {changes.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-zinc-500">
          기록된 변경 내역이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {changes.map((change) => (
            <SettlementChangeRow change={change} key={change.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function SettlementChangeRow({ change }: { change: SettlementChange }) {
  const deltas = amountDeltaFields
    .map(({ key, label }) => ({
      key,
      label,
      value: change.amountDeltas[key] ?? 0,
    }))
    .filter(({ value }) => value !== 0);

  return (
    <article className="grid gap-3 px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-950">
            {settlementChangeTypeLabels[change.changeType]}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {change.description ?? "변경 설명이 없습니다."}
          </p>
        </div>
        <time className="text-xs text-zinc-500" dateTime={change.createdAt}>
          {formatFullDateTime(change.createdAt)}
        </time>
      </div>
      {deltas.length === 0 ? (
        <p className="text-sm text-zinc-500">금액 변경 없음</p>
      ) : (
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {deltas.map((delta) => (
            <div
              className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2"
              key={delta.key}
            >
              <dt className="text-xs text-zinc-500">{delta.label}</dt>
              <dd
                className={cn(
                  "mt-1 text-sm font-semibold",
                  delta.value > 0 ? "text-emerald-700" : "text-red-700",
                )}
              >
                {formatSignedWon(delta.value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function formatSignedWon(value: number): string {
  if (value === 0) {
    return formatWon(0);
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatWon(Math.abs(value))}`;
}
