import type { ParticipantSettlementPreview } from "@/services/settlements.service";
import { formatPercent } from "@/features/fees/lib/fee-policy";
import { ParticipantTypeBadge } from "@/features/participants/components/participant-type-badge";
import { formatWon } from "@/lib/money";

export function SettlementPreviewTable({
  participants,
  onOpenParticipantDetail,
}: {
  participants: ParticipantSettlementPreview[];
  onOpenParticipantDetail: (participantId: string) => void;
}) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {participants.map((participant) => (
          <SettlementPreviewCard
            key={participant.participantId}
            participant={participant}
            onSelectParticipant={onOpenParticipantDetail}
          />
        ))}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto rounded-[12px] border border-hairline bg-surface shadow-card md:block">
        <table className="w-full min-w-[960px] border-collapse text-sm xl:min-w-[1180px]">
          <thead className="bg-surface-sunken text-center text-muted">
            <tr>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                참가 부스
              </th>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                현금
              </th>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                카드
              </th>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                계좌이체
              </th>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                기타
              </th>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                총매출
              </th>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                판매 수수료
              </th>
              <th className="px-4 py-3.5 text-center font-medium xl:px-6">
                카드 수수료
              </th>
              <th className="px-4 py-3.5 text-center font-semibold text-brand xl:px-6">
                지급 예정
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {participants.map((participant) => (
              <SettlementPreviewRow
                key={participant.participantId}
                participant={participant}
                onSelectParticipant={onOpenParticipantDetail}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SettlementPreviewCard({
  onSelectParticipant,
  participant,
}: {
  onSelectParticipant: (participantId: string) => void;
  participant: ParticipantSettlementPreview;
}) {
  return (
    <button
      className="grid gap-3 rounded-[12px] border border-hairline bg-surface p-4 text-left shadow-card transition hover:bg-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      data-testid="settlement-card"
      onClick={() => onSelectParticipant(participant.participantId)}
      type="button"
    >
      <span className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-ink">
            {participant.displayName}
          </span>
          <span className="mt-1 flex items-center gap-1.5">
            <ParticipantTypeBadge type={participant.participantType} />
            <span className="font-mono text-[10.5px] text-muted-soft">
              {participant.saleLineCount}건
            </span>
          </span>
        </span>
        <span className="text-right font-display text-[15px] font-bold text-success">
          {formatWon(participant.payoutAmount)}
        </span>
      </span>
      <span className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
        <SettlementCardMetric
          label="총매출"
          value={formatWon(participant.netSalesAmount)}
        />
        <SettlementCardMetric
          label="판매 수수료"
          value={`${formatWon(participant.salesCommissionAmount)} ${formatPercent(
            participant.salesCommissionRate,
          )}`}
        />
        <SettlementCardMetric
          label="현금"
          value={formatWon(participant.cashSalesAmount)}
        />
        <SettlementCardMetric
          label="카드"
          value={formatWon(participant.cardSalesAmount)}
        />
        <SettlementCardMetric
          label="카드 수수료"
          value={`${formatWon(participant.cardFeeAmount)} ${
            participant.cardFeePayer === "participant" ? "참가부스" : "마켓"
          }`}
        />
        <SettlementCardMetric
          label="계좌/기타"
          value={`${formatWon(participant.transferSalesAmount)} / ${formatWon(
            participant.otherSalesAmount,
          )}`}
        />
      </span>
    </button>
  );
}

function SettlementCardMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="min-w-0 rounded-[8px] bg-canvas-soft px-3 py-2">
      <span className="block font-mono text-[10px] text-muted">
        {label}
      </span>
      <span className="mt-0.5 block truncate font-display font-semibold text-amount-default">
        {value}
      </span>
    </span>
  );
}

function SettlementPreviewRow({
  onSelectParticipant,
  participant,
}: {
  onSelectParticipant: (participantId: string) => void;
  participant: ParticipantSettlementPreview;
}) {
  return (
    <tr
      className="cursor-pointer transition hover:bg-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      data-testid="settlement-row"
      onClick={() => onSelectParticipant(participant.participantId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectParticipant(participant.participantId);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <td className="px-4 py-4 xl:px-6">
        <p className="text-[14.5px] font-semibold text-ink">
          {participant.displayName}
        </p>
        <p className="mt-1 flex items-center gap-1.5">
          <ParticipantTypeBadge type={participant.participantType} />
          <span className="font-mono text-[10.5px] text-muted-soft">
            {participant.saleLineCount}건
          </span>
        </p>
      </td>
      <td className="px-4 py-4 text-right font-display text-[13.5px] text-body xl:px-6">
        {formatWon(participant.cashSalesAmount)}
      </td>
      <td className="px-4 py-4 text-right font-display text-[13.5px] text-body xl:px-6">
        {formatWon(participant.cardSalesAmount)}
      </td>
      <td className="px-4 py-4 text-right font-display text-[13.5px] text-body xl:px-6">
        {formatWon(participant.transferSalesAmount)}
      </td>
      <td className="px-4 py-4 text-right font-display text-[13.5px] text-body xl:px-6">
        {formatWon(participant.otherSalesAmount)}
      </td>
      <td className="px-4 py-4 text-right font-display text-[14.5px] font-bold text-amount-default xl:px-6">
        {formatWon(participant.netSalesAmount)}
      </td>
      <td className="px-4 py-4 text-right font-display text-[13.5px] font-semibold text-amount-default xl:px-6">
        {formatWon(participant.salesCommissionAmount)}
        <span className="ml-1 font-mono text-[10px] text-muted-soft">
          {formatPercent(participant.salesCommissionRate)}
        </span>
      </td>
      <td className="px-4 py-4 text-right font-display text-[13.5px] font-semibold text-info xl:px-6">
        {formatWon(participant.cardFeeAmount)}
        <span className="ml-1 font-mono text-[10px] text-muted-soft">
          {formatPercent(participant.cardFeeRate)}
        </span>
        <span className="ml-1 font-mono text-[10px] text-muted-soft">
          {participant.cardFeePayer === "participant" ? "참가부스" : "마켓"}
        </span>
      </td>
      <td className="px-4 py-4 text-right font-display text-[15px] font-bold text-success xl:px-6">
        {formatWon(participant.payoutAmount)}
      </td>
    </tr>
  );
}
