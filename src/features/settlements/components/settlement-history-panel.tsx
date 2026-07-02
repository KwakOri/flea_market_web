import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { useSettlement } from "@/hooks/use-settlement-preview";
import { formatWon } from "@/lib/money";
import { PARTICIPATING_SELLER, SELLER } from "@/lib/terminology";
import { cn } from "@/lib/utils";
import type {
  Settlement,
  SettlementListItem,
  SettlementParticipantSnapshot,
} from "@/services/settlements.service";
import type { ReactNode } from "react";

type ParticipantDeltaRow = {
  afterAmount: number | null;
  beforeAmount: number | null;
  delta: number | null;
  key: string;
  name: string;
};

export function SettlementHistoryPanel({
  history,
  isLoading,
  onOpenSettlementDetail,
}: {
  history: SettlementListItem[];
  isLoading: boolean;
  onOpenSettlementDetail: (settlementId: string) => void;
}) {
  const sortedHistory = [...history].sort((a, b) => b.versionNo - a.versionNo);
  const currentSettlementSummary =
    sortedHistory.find((settlement) => settlement.status === "confirmed") ??
    sortedHistory[0] ??
    null;
  const previousSettlementSummary = currentSettlementSummary
    ? findPreviousSettlement(currentSettlementSummary, sortedHistory)
    : null;
  const currentSettlementQuery = useSettlement(currentSettlementSummary?.id ?? null);
  const previousSettlementQuery = useSettlement(
    previousSettlementSummary?.id ?? null,
  );

  if (isLoading) {
    return <SettlementHistoryMessage>확정 이력을 불러오는 중입니다.</SettlementHistoryMessage>;
  }

  if (history.length === 0) {
    return <SettlementHistoryMessage>확정된 정산이 없습니다.</SettlementHistoryMessage>;
  }

  if (!currentSettlementSummary) {
    return <SettlementHistoryMessage>확정된 정산이 없습니다.</SettlementHistoryMessage>;
  }

  const currentSettlement = currentSettlementQuery.data ?? currentSettlementSummary;
  const previousSettlement =
    previousSettlementQuery.data ?? previousSettlementSummary;
  const payoutDelta = previousSettlement
    ? currentSettlement.participantPayoutAmount -
      previousSettlement.participantPayoutAmount
    : null;

  return (
    <section className="grid gap-[22px]">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-3.5">
        <h3 className="dsp m-0 text-[30px] font-bold leading-tight text-ink">
          정산 회차 상세
        </h3>
        <p className="mono text-[12px] text-muted">
          수정 정산은 이전 회차 대비 변경 이력으로 남습니다
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-[12px] border border-hairline bg-surface p-[14px] shadow-card">
          <div className="dsp px-2 pb-3 pt-1 text-[14px] font-bold text-ink">
            정산 회차
          </div>
          <div className="grid gap-1.5">
            {sortedHistory.map((settlement) => (
              <SettlementVersionButton
                currentSettlement={currentSettlementSummary}
                key={settlement.id}
                previousSettlement={findPreviousSettlement(
                  settlement,
                  sortedHistory,
                )}
                settlement={settlement}
                onOpenSettlementDetail={onOpenSettlementDetail}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-[18px]">
          <div className="flex flex-col gap-5 rounded-[12px] bg-brand-deep px-5 py-[22px] text-on-brand-deep md:flex-row md:items-center md:justify-between md:px-6">
            <div className="min-w-0">
              <p className="mono text-[11px] text-muted-soft">
                현재 회차 · v{currentSettlement.versionNo} (
                {settlementStatusLabels[currentSettlement.status]})
              </p>
              <p className="dsp mt-1 text-[21px] font-bold leading-tight">
                {formatPayoutDeltaTitle(payoutDelta)}
              </p>
              <p className="mono mt-1.5 truncate text-[12px] text-brand-spring">
                변경 사유 · {currentSettlement.memo?.trim() || "메모 없음"}
              </p>
            </div>
            <div className="shrink-0 text-left md:text-right">
              <p className="mono text-[10.5px] text-muted-soft">
                {previousSettlement
                  ? `v${previousSettlement.versionNo} → v${currentSettlement.versionNo}`
                  : `v${currentSettlement.versionNo}`}
              </p>
              <p className="num mt-1 text-[22px] font-bold leading-tight md:text-[24px]">
                {previousSettlement
                  ? `${formatWonWithoutSuffix(
                      previousSettlement.participantPayoutAmount,
                    )} → ${formatWonWithoutSuffix(
                      currentSettlement.participantPayoutAmount,
                    )}`
                  : formatWon(currentSettlement.participantPayoutAmount)}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-hairline bg-surface shadow-card">
            <SettlementParticipantDeltaTable
              currentSettlement={currentSettlementQuery.data ?? null}
              currentSettlementSummary={currentSettlementSummary}
              isLoading={
                currentSettlementQuery.isLoading ||
                (Boolean(previousSettlementSummary) &&
                  previousSettlementQuery.isLoading)
              }
              previousSettlement={previousSettlementQuery.data ?? null}
              previousSettlementSummary={previousSettlementSummary}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SettlementHistoryMessage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-hairline bg-surface px-4 py-10 text-center text-sm text-muted shadow-card">
      {children}
    </div>
  );
}

function SettlementVersionButton({
  currentSettlement,
  previousSettlement,
  settlement,
  onOpenSettlementDetail,
}: {
  currentSettlement: SettlementListItem;
  previousSettlement: SettlementListItem | null;
  settlement: SettlementListItem;
  onOpenSettlementDetail: (settlementId: string) => void;
}) {
  const isCurrent = settlement.id === currentSettlement.id;
  const delta = previousSettlement
    ? settlement.participantPayoutAmount -
      previousSettlement.participantPayoutAmount
    : null;

  return (
    <button
      aria-label={`v${settlement.versionNo} 정산 상세 열기`}
      className={cn(
        "flex w-full items-center gap-3 rounded-[12px] border px-3 py-[13px] text-left transition-colors",
        isCurrent
          ? "border-brand-tint-strong bg-brand-tint"
          : "border-hairline bg-surface hover:bg-canvas-soft",
        settlement.status === "voided" && "opacity-60",
      )}
      data-testid="settlement-history-row"
      onClick={() => onOpenSettlementDetail(settlement.id)}
      type="button"
    >
      <span
        className={cn(
          "dsp num text-[17px] font-bold",
          isCurrent ? "text-ink" : "text-muted",
        )}
      >
        v{settlement.versionNo}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[13px] font-semibold",
            isCurrent ? "text-ink" : "text-body",
          )}
        >
          {formatVersionStatus(settlement, isCurrent)}
        </span>
        <span className="mono block truncate text-[10.5px] text-muted-soft">
          {formatHistoryTimestamp(settlement.confirmedAt)}
        </span>
      </span>
      <span
        className={cn(
          "num shrink-0 text-[13px] font-bold",
          getDeltaTextClass(delta),
        )}
      >
        {formatDelta(delta)}
      </span>
    </button>
  );
}

function SettlementParticipantDeltaTable({
  currentSettlement,
  currentSettlementSummary,
  isLoading,
  previousSettlement,
  previousSettlementSummary,
}: {
  currentSettlement: Settlement | null;
  currentSettlementSummary: SettlementListItem;
  isLoading: boolean;
  previousSettlement: Settlement | null;
  previousSettlementSummary: SettlementListItem | null;
}) {
  const rows = buildParticipantDeltaRows(currentSettlement, previousSettlement);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[620px]">
        <div
          className="grid border-b border-hairline bg-canvas-soft px-[22px] py-[13px]"
          style={{
            gridTemplateColumns:
              "minmax(120px, 1.4fr) minmax(96px, 1fr) minmax(96px, 1fr) minmax(90px, 1fr)",
          }}
        >
          <span className="mono text-[11px] font-bold text-muted">
            {PARTICIPATING_SELLER}
          </span>
          <span className="mono text-right text-[11px] font-bold text-muted">
            {previousSettlementSummary
              ? `v${previousSettlementSummary.versionNo} 지급`
              : "이전 지급"}
          </span>
          <span className="mono text-right text-[11px] font-bold text-muted">
            v{currentSettlementSummary.versionNo} 지급
          </span>
          <span className="mono text-right text-[11px] font-bold text-muted">
            Δ 변경
          </span>
        </div>

        {isLoading ? (
          <div className="px-[22px] py-10 text-center text-sm text-muted">
            {SELLER}별 변경 내역을 불러오는 중입니다.
          </div>
        ) : rows.length > 0 ? (
          rows.map((row) => (
            <SettlementParticipantDeltaTableRow key={row.key} row={row} />
          ))
        ) : (
          <div className="px-[22px] py-10 text-center text-sm text-muted">
            저장된 {SELLER}별 변경 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function SettlementParticipantDeltaTableRow({
  row,
}: {
  row: ParticipantDeltaRow;
}) {
  const hasChanged = row.delta !== null && row.delta !== 0;

  return (
    <div
      className={cn(
        "grid items-center border-b border-hairline px-[22px] py-[13px] last:border-b-0",
        hasChanged ? "bg-brand-tint" : "bg-surface",
      )}
      data-testid="settlement-history-delta-row"
      style={{
        gridTemplateColumns:
          "minmax(120px, 1.4fr) minmax(96px, 1fr) minmax(96px, 1fr) minmax(90px, 1fr)",
      }}
    >
      <div className="truncate text-[14px] font-semibold text-ink">
        {row.name}
      </div>
      <div className="num text-right text-[13.5px] text-muted">
        {formatOptionalWon(row.beforeAmount)}
      </div>
      <div className="num text-right text-[14px] font-semibold text-ink">
        {formatOptionalWon(row.afterAmount)}
      </div>
      <div
        className={cn(
          "num text-right text-[14px] font-bold",
          getDeltaTextClass(row.delta),
        )}
      >
        {formatDelta(row.delta)}
      </div>
    </div>
  );
}

function buildParticipantDeltaRows(
  currentSettlement: Settlement | null,
  previousSettlement: Settlement | null,
): ParticipantDeltaRow[] {
  if (!currentSettlement) {
    return [];
  }

  const previousParticipants = new Map(
    (previousSettlement?.participants ?? []).map((participant) => [
      getParticipantDeltaKey(participant),
      participant,
    ]),
  );
  const currentParticipants = new Map(
    currentSettlement.participants.map((participant) => [
      getParticipantDeltaKey(participant),
      participant,
    ]),
  );

  const currentRows = currentSettlement.participants.map((participant) => {
    const key = getParticipantDeltaKey(participant);
    const previousParticipant = previousParticipants.get(key) ?? null;
    const beforeAmount = previousParticipant?.payoutAmount ?? null;
    const afterAmount = participant.payoutAmount;

    return {
      afterAmount,
      beforeAmount,
      delta: previousSettlement
        ? afterAmount - (beforeAmount ?? 0)
        : null,
      key,
      name: participant.displayName,
    };
  });

  const removedRows = [...previousParticipants.entries()]
    .filter(([key]) => !currentParticipants.has(key))
    .map(([key, participant]) => ({
      afterAmount: null,
      beforeAmount: participant.payoutAmount,
      delta: previousSettlement ? 0 - participant.payoutAmount : null,
      key,
      name: participant.displayName,
    }));

  return [...currentRows, ...removedRows];
}

function getParticipantDeltaKey(
  participant: SettlementParticipantSnapshot,
): string {
  return participant.participantId ?? participant.displayName;
}

function findPreviousSettlement(
  settlement: SettlementListItem,
  history: SettlementListItem[],
): SettlementListItem | null {
  if (settlement.baseSettlementId) {
    const baseSettlement = history.find(
      (candidate) => candidate.id === settlement.baseSettlementId,
    );

    if (baseSettlement) {
      return baseSettlement;
    }
  }

  return (
    history
      .filter((candidate) => candidate.versionNo < settlement.versionNo)
      .sort((a, b) => b.versionNo - a.versionNo)[0] ?? null
  );
}

function formatVersionStatus(
  settlement: SettlementListItem,
  isCurrent: boolean,
): string {
  if (settlement.status === "voided") {
    return settlementStatusLabels.voided;
  }

  if (isCurrent) {
    return "확정 · 현재";
  }

  if (settlement.status === "superseded") {
    return "확정 · 이전 회차";
  }

  return settlementStatusLabels[settlement.status];
}

function formatPayoutDeltaTitle(delta: number | null): string {
  if (delta === null) {
    return "최초 정산 회차";
  }

  if (delta > 0) {
    return `총 지급액 ${formatDelta(delta)} 증가`;
  }

  if (delta < 0) {
    return `총 지급액 ${formatDelta(delta)} 감소`;
  }

  return "총 지급액 변동 없음";
}

function formatDelta(delta: number | null): string {
  if (delta === null) {
    return "—";
  }

  if (delta === 0) {
    return "±0원";
  }

  const sign = delta > 0 ? "+" : "-";

  return `${sign}${formatWon(Math.abs(delta))}`;
}

function formatWonWithoutSuffix(amount: number): string {
  return formatWon(amount).replace(/원$/, "");
}

function formatOptionalWon(amount: number | null): string {
  return amount === null ? "—" : formatWon(amount);
}

function formatHistoryTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}.${day} ${hours}:${minutes}`;
}

function getDeltaTextClass(delta: number | null): string {
  if (delta === null || delta === 0) {
    return "text-muted-soft";
  }

  return delta > 0 ? "text-success" : "text-error";
}
