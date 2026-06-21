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
    <div className="min-w-0 max-w-full overflow-x-auto rounded-[18px] border border-[#e6e2d4] bg-white shadow-[0_1px_3px_rgba(26,27,18,0.05)]">
      <table className="w-full min-w-[1240px] border-collapse text-sm">
        <thead className="bg-[#16170f] text-left font-mono text-[10px] uppercase tracking-[0.06em] text-[#9b9a86]">
          <tr>
            <th className="px-6 py-3.5 font-semibold">참가 부스</th>
            <th className="px-6 py-3.5 text-right font-semibold">현금</th>
            <th className="px-6 py-3.5 text-right font-semibold">카드</th>
            <th className="px-6 py-3.5 text-right font-semibold">계좌이체</th>
            <th className="px-6 py-3.5 text-right font-semibold">기타</th>
            <th className="px-6 py-3.5 text-right font-semibold">총매출</th>
            <th className="px-6 py-3.5 text-right font-semibold">
              판매 수수료
            </th>
            <th className="px-6 py-3.5 text-right font-semibold">
              카드 수수료
            </th>
            <th className="px-6 py-3.5 text-right font-semibold text-[#c7f94b]">
              지급 예정
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1eee2]">
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
      className="cursor-pointer transition hover:bg-[#fcfdf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c7f94b]"
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
      <td className="px-6 py-4">
        <p className="text-[14.5px] font-semibold text-[#1a1b12]">
          {participant.displayName}
        </p>
        <p className="mt-1 flex items-center gap-1.5">
          <ParticipantTypeBadge type={participant.participantType} />
          <span className="font-mono text-[10.5px] text-[#a8a593]">
            {participant.saleLineCount}건
          </span>
        </p>
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.cashSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.cardSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.transferSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] text-[#56564a]">
        {formatWon(participant.otherSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[14.5px] font-bold text-[#1a1b12]">
        {formatWon(participant.netSalesAmount)}
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] font-semibold text-[#1a1b12]">
        {formatWon(participant.salesCommissionAmount)}
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {formatPercent(participant.salesCommissionRate)}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-display text-[13.5px] font-semibold text-[#2d6fe0]">
        {formatWon(participant.cardFeeAmount)}
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {formatPercent(participant.cardFeeRate)}
        </span>
        <span className="ml-1 font-mono text-[10px] text-[#a8a593]">
          {participant.cardFeePayer === "participant" ? "참가부스" : "마켓"}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-display text-[15px] font-bold text-[#1f8a4d]">
        {formatWon(participant.payoutAmount)}
      </td>
    </tr>
  );
}
