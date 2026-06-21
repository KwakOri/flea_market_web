import type { Settlement } from "@/services/settlements.service";
import {
  cardFeePayerLabels,
  formatPercent,
} from "@/features/fees/lib/fee-policy";
import {
  participantTypeLabels,
  settlementTypeLabels,
} from "@/features/participants/lib/participant-display";
import { formatWon } from "@/lib/money";
import {
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";

export function SettlementParticipantSnapshots({
  participantCount,
  participants,
}: {
  participantCount: number;
  participants: Settlement["participants"];
}) {
  return (
    <section className={panelVariants()}>
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>부스별 정산 데이터</h2>
        <p className={sectionDescriptionClass}>
          확정 당시 저장된 참가부스별 스냅샷 {participantCount}개
        </p>
      </div>
      {participants.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-zinc-500">
          저장된 부스별 정산 데이터가 없습니다.
        </div>
      ) : (
        <div className="min-w-0 max-w-full overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">참가부스</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">정산 방식</th>
                <th className="px-4 py-3 text-right font-medium">영수증</th>
                <th className="px-4 py-3 text-right font-medium">판매 건수</th>
                <th className="px-4 py-3 text-right font-medium">총매출</th>
                <th className="px-4 py-3 text-right font-medium">
                  판매 수수료
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  카드 수수료
                </th>
                <th className="px-4 py-3 text-right font-medium">지급액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {participants.map((participant) => (
                <tr key={participant.id}>
                  <td className="px-4 py-3 font-medium text-zinc-950">
                    {participant.displayName}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {participantTypeLabels[participant.participantType]}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {settlementTypeLabels[participant.settlementType]}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700">
                    {participant.receiptCount}건
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700">
                    {participant.saleLineCount}건
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-950">
                    {formatWon(participant.netSalesAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700">
                    {formatWon(participant.salesCommissionAmount)}
                    <span className="ml-1 text-xs text-zinc-400">
                      ({formatPercent(participant.salesCommissionRate)})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700">
                    {formatWon(participant.cardFeeAmount)}
                    <span className="ml-1 text-xs text-zinc-400">
                      ({cardFeePayerLabels[participant.cardFeePayer]})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-zinc-950">
                    {formatWon(participant.payoutAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
