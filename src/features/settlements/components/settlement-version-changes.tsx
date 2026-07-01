import type {
  SettlementAmountDeltas,
  SettlementChange,
  SettlementChangeType,
} from "@/services/settlements.service";
import { formatFullDateTime } from "@/lib/date-format";
import { formatWon } from "@/lib/money";
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
    <section className="rounded-[12px] border border-hairline bg-surface px-5 py-[22px] shadow-card sm:px-6">
      <h2 className="dsp m-0 text-[17px] font-bold text-ink">
        변경 내역
      </h2>
      <p className="mb-[18px] mt-1.5 text-[13px] text-muted">
        회차 생성 시 저장된 변경 사유와 금액 변화입니다.
      </p>
      {changes.length === 0 ? (
        <div className="rounded-[12px] bg-canvas-soft px-4 py-10 text-center text-sm text-muted">
          기록된 변경 내역이 없습니다.
        </div>
      ) : (
        <div className="grid gap-5">
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
    <article className="flex gap-3.5">
      <div className="flex flex-none flex-col items-center pt-[3px]">
        <span className="h-[11px] w-[11px] rounded-full border-2 border-ink bg-brand-spring" />
      </div>
      <div className="-ml-1 flex-1 border-l border-hairline pl-[18px]">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="dsp text-[14.5px] font-bold text-ink">
            {settlementChangeTypeLabels[change.changeType]}
          </span>
          <time
            className="mono text-[11px] text-muted-soft"
            dateTime={change.createdAt}
          >
            {formatFullDateTime(change.createdAt)}
          </time>
        </div>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {change.description?.trim() || "변경 설명이 없습니다."}
        </p>
        {deltas.length === 0 ? (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-[7px] bg-canvas-soft px-2.5 py-1">
            <span className="mono text-[11px] font-semibold text-muted">
              금액 변경 없음
            </span>
          </div>
        ) : (
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {deltas.map((delta) => (
              <div
                className="rounded-[8px] border border-hairline bg-canvas-soft px-3 py-2"
                key={delta.key}
              >
                <dt className="mono text-[10px] text-muted">
                  {delta.label}
                </dt>
                <dd
                  className={cn(
                    "num mt-1 text-[13px] font-bold",
                    delta.value > 0 ? "text-[#1f8a4d]" : "text-error",
                  )}
                >
                  {formatSignedWon(delta.value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
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
