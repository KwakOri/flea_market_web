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
import { PARTICIPATING_SELLER, SELLER_SETTLEMENT_DATA_LABEL } from "@/lib/terminology";
import { cn } from "@/lib/utils";

const snapshotGridColumns =
  "minmax(130px,1.4fr) minmax(72px,.7fr) minmax(86px,.8fr) minmax(76px,.7fr) minmax(86px,.8fr) minmax(110px,1fr) minmax(130px,1.15fr) minmax(140px,1.15fr) minmax(110px,1.05fr)";

export function SettlementParticipantSnapshots({
  participantCount,
  participants,
}: {
  participantCount: number;
  participants: Settlement["participants"];
}) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-hairline bg-surface shadow-card">
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <h2 className="dsp m-0 text-[17px] font-bold text-ink">
          {SELLER_SETTLEMENT_DATA_LABEL}
        </h2>
        <p className="mono mt-[5px] text-[11px] tracking-[0.02em] text-muted">
          확정 당시 저장된 {PARTICIPATING_SELLER}별 스냅샷 {participantCount}개
        </p>
      </div>
      {participants.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted sm:px-6">
          저장된 {SELLER_SETTLEMENT_DATA_LABEL}가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div
              className="grid bg-surface-sunken px-5 py-3 sm:px-6"
              style={{ gridTemplateColumns: snapshotGridColumns }}
            >
              <SnapshotHeader>{PARTICIPATING_SELLER}</SnapshotHeader>
              <SnapshotHeader>유형</SnapshotHeader>
              <SnapshotHeader>정산 방식</SnapshotHeader>
              <SnapshotHeader align="right">영수증</SnapshotHeader>
              <SnapshotHeader align="right">판매 건수</SnapshotHeader>
              <SnapshotHeader align="right">총매출</SnapshotHeader>
              <SnapshotHeader align="right">판매 수수료</SnapshotHeader>
              <SnapshotHeader align="right">카드 수수료</SnapshotHeader>
              <SnapshotHeader align="right" accent>
                지급액
              </SnapshotHeader>
            </div>
            {participants.map((participant) => (
              <div
                className="grid items-center border-b border-hairline px-5 py-3.5 last:border-b-0 sm:px-6"
                key={participant.id}
                style={{ gridTemplateColumns: snapshotGridColumns }}
              >
                <div className="truncate text-[14px] font-semibold text-ink">
                  {participant.displayName}
                </div>
                <div>
                  <span
                    className={cn(
                      "mono inline-flex rounded-[5px] px-[7px] py-0.5 text-[9.5px] font-semibold",
                      getParticipantTypeBadgeClass(participant.participantType),
                    )}
                  >
                    {participantTypeLabels[participant.participantType]}
                  </span>
                </div>
                <div className="mono text-[11.5px] text-muted">
                  {settlementTypeLabels[participant.settlementType]}
                </div>
                <div className="num text-right text-[13px] text-body">
                  {participant.receiptCount}건
                </div>
                <div className="num text-right text-[13px] text-body">
                  {participant.saleLineCount}건
                </div>
                <div className="num text-right text-[14px] font-bold text-amount-default">
                  {formatWon(participant.netSalesAmount)}
                </div>
                <div className="text-right">
                  <span className="num text-[13px] font-semibold text-amount-default">
                    {formatWon(participant.salesCommissionAmount)}
                  </span>{" "}
                  <span className="mono text-[10px] text-muted-soft">
                    ({formatPercent(participant.salesCommissionRate)})
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "num text-[13px] font-semibold",
                      participant.cardFeeAmount === 0
                        ? "text-muted-soft"
                        : "text-info",
                    )}
                  >
                    {formatWon(participant.cardFeeAmount)}
                  </span>{" "}
                  <span
                    className={cn(
                      "mono text-[9.5px]",
                      participant.cardFeePayer === "market"
                        ? "text-warning"
                        : "text-muted-soft",
                    )}
                  >
                    {cardFeePayerLabels[participant.cardFeePayer]}
                  </span>
                </div>
                <div className="num text-right text-[15px] font-bold text-success">
                  {formatWon(participant.payoutAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SnapshotHeader({
  accent = false,
  align = "left",
  children,
}: {
  accent?: boolean;
  align?: "left" | "right";
  children: string;
}) {
  return (
    <span
      className={cn(
        "text-sm",
        accent ? "font-semibold text-brand" : "font-medium text-muted",
        align === "right" && "text-right",
      )}
    >
      {children}
    </span>
  );
}

function getParticipantTypeBadgeClass(type: string): string {
  switch (type) {
    case "staff":
      return "bg-[#26271c] text-[#d7d3bf]";
    case "special_booth":
      return "bg-brand-tint text-brand";
    case "seller":
    default:
      return "bg-canvas-soft text-muted";
  }
}
