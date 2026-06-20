"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Ban, CheckCircle2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  useSettlement,
  useVoidSettlement,
} from "@/hooks/use-settlement-preview";
import type {
  CardFeePayer,
  ParticipantType,
  SettlementType,
} from "@/services/participants.service";
import type {
  Settlement,
  SettlementAmountDeltas,
  SettlementChange,
  SettlementChangeType,
  SettlementStatus,
} from "@/services/settlements.service";
import { cn } from "@/lib/utils";
import {
  appShellClass,
  buttonVariants,
  inputClass,
  pageShellClass,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";

type SettlementVersionDetailClientProps = {
  marketId?: string;
  settlementId: string;
};

type AmountDeltaKey = keyof SettlementAmountDeltas;
type ToastState = {
  id: number;
  message: string;
  title: string;
};

const participantTypeLabels: Record<ParticipantType, string> = {
  staff: "운영진",
  seller: "셀러",
  special_booth: "특수 부스",
};

const settlementTypeLabels: Record<SettlementType, string> = {
  commission: "수수료",
  manual: "수기",
  investment: "투자",
};

const cardFeePayerLabels: Record<CardFeePayer, string> = {
  market: "마켓 부담",
  participant: "참가부스 부담",
};

const settlementStatusLabels: Record<SettlementStatus, string> = {
  confirmed: "확정",
  superseded: "이전 회차",
  voided: "무효",
};

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

export function SettlementVersionDetailClient({
  marketId,
  settlementId,
}: SettlementVersionDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const user = currentUser.data ?? null;
  const settlementQuery = useSettlement(settlementId);
  const voidSettlement = useVoidSettlement(settlementId);
  const settlement = settlementQuery.data ?? null;
  const backMarketId = marketId ?? settlement?.marketId ?? null;
  const toastIdRef = useRef(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [voidMemo, setVoidMemo] = useState("");
  const [voidMessage, setVoidMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser.isFetched || user) {
      return;
    }

    const currentPath =
      typeof window === "undefined"
        ? pathname
        : `${pathname}${window.location.search}`;

    router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
  }, [currentUser.isFetched, pathname, router, user]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((currentToast) =>
        currentToast?.id === toast.id ? null : currentToast,
      );
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const sortedParticipants = useMemo(() => {
    return [...(settlement?.participants ?? [])].sort((left, right) =>
      left.displayName.localeCompare(right.displayName, "ko-KR"),
    );
  }, [settlement?.participants]);

  function handleBack() {
    router.push(
      backMarketId ? `/markets/${backMarketId}/settlements` : "/management",
    );
  }

  function showToast(title: string, message: string) {
    toastIdRef.current += 1;
    setToast({
      id: toastIdRef.current,
      title,
      message,
    });
  }

  async function handleVoidSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVoidMessage(null);

    if (!settlement || settlement.status === "voided") {
      return;
    }

    const confirmed = window.confirm("이 정산 회차를 무효 처리할까요?");

    if (!confirmed) {
      return;
    }

    try {
      await voidSettlement.mutateAsync({
        memo: voidMemo.trim() || undefined,
      });
      setVoidMemo("");
      showToast("정산 무효 처리 완료", "정산 회차를 무효 처리했습니다.");
    } catch (error) {
      setVoidMessage(getErrorMessage(error));
    }
  }

  if (currentUser.isLoading) {
    return <PageStateMessage message="사용자 정보를 확인하는 중입니다." />;
  }

  if (currentUser.isError) {
    return <PageStateMessage message="사용자 정보를 불러오지 못했습니다." />;
  }

  if (!user) {
    return <PageStateMessage message="로그인 페이지로 이동하는 중입니다." />;
  }

  if (settlementQuery.isLoading) {
    return <PageStateMessage message="정산 회차를 불러오는 중입니다." />;
  }

  if (settlementQuery.isError) {
    return <PageStateMessage message="정산 회차를 불러오지 못했습니다." />;
  }

  if (!settlement) {
    return <PageStateMessage message="정산 회차를 찾을 수 없습니다." />;
  }

  return (
    <main className={pageShellClass}>
      <div className={appShellClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              className={buttonVariants({ intent: "quiet", size: "sm" })}
              onClick={handleBack}
              type="button"
            >
              <ArrowLeft aria-hidden className="mr-2 h-4 w-4" />
              정산 목록
            </button>
            <h1 className="mt-3 text-2xl font-semibold text-zinc-950">
              v{settlement.versionNo} 정산
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              확정된 정산 회차의 기준 데이터와 변경 내역을 확인합니다.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex h-8 w-fit items-center rounded-full px-3 text-xs font-semibold",
              getStatusBadgeClass(settlement.status),
            )}
          >
            {settlementStatusLabels[settlement.status]}
          </span>
        </div>

        <SettlementSummary settlement={settlement} />
        {settlement.status !== "voided" && (
          <SettlementManagement
            isSubmitting={voidSettlement.isPending}
            memo={voidMemo}
            message={voidMessage}
            settlement={settlement}
            onMemoChange={setVoidMemo}
            onSubmit={handleVoidSettlement}
          />
        )}
        <SettlementChanges changes={settlement.changes} />
        <SettlementParticipantSnapshots
          participants={sortedParticipants}
          participantCount={settlement.participantCount}
        />
        <Toast
          toast={toast}
          onDismiss={() => {
            setToast(null);
          }}
        />
      </div>
    </main>
  );
}

function SettlementSummary({ settlement }: { settlement: Settlement }) {
  return (
    <section className={panelVariants()}>
      <div
        className={cn(
          sectionHeaderClass,
          "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div>
          <h2 className={sectionTitleClass}>정산 개요</h2>
          <p className={sectionDescriptionClass}>
            확정 시각 {formatDateTime(settlement.confirmedAt)}
          </p>
        </div>
        <div className="text-left text-xs text-zinc-500 sm:text-right">
          <p>기준 회차</p>
          <p className="mt-1 font-mono text-zinc-700">
            {settlement.baseSettlementId
              ? shortId(settlement.baseSettlementId)
              : "-"}
          </p>
        </div>
      </div>
      <dl className="grid gap-px border-b border-zinc-200 bg-zinc-200 sm:grid-cols-2 xl:grid-cols-3">
        <SettlementMetric
          label="총매출"
          value={formatWon(settlement.netSalesAmount)}
        />
        <SettlementMetric
          label="지급 예정"
          value={formatWon(settlement.participantPayoutAmount)}
        />
        <SettlementMetric
          label="마켓 손익"
          value={formatWon(settlement.marketProfitAmount)}
        />
        <SettlementMetric
          label="판매 수수료"
          value={formatWon(settlement.salesCommissionAmount)}
        />
        <SettlementMetric
          label="참가부스 부담 카드 수수료"
          value={formatWon(settlement.cardFeeChargedToParticipantAmount)}
        />
        <SettlementMetric
          label="마켓 부담 카드 수수료"
          value={formatWon(settlement.cardFeePaidByMarketAmount)}
        />
      </dl>
      <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem label="참가부스" value={`${settlement.participantCount}개`} />
        <MetaItem label="영수증" value={`${settlement.receiptCount}건`} />
        <MetaItem label="판매 건수" value={`${settlement.saleLineCount}건`} />
        <MetaItem label="메모" value={settlement.memo ?? "-"} />
      </dl>
    </section>
  );
}

function SettlementManagement({
  isSubmitting,
  memo,
  message,
  settlement,
  onMemoChange,
  onSubmit,
}: {
  isSubmitting: boolean;
  memo: string;
  message: string | null;
  settlement: Settlement;
  onMemoChange: (memo: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className={panelVariants()}>
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>회차 관리</h2>
      </div>
      <form
        className="grid gap-2 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={onSubmit}
      >
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          무효 사유
          <input
            className={inputClass}
            disabled={isSubmitting}
            maxLength={1000}
            placeholder={`v${settlement.versionNo} 무효 사유`}
            value={memo}
            onChange={(event) => onMemoChange(event.target.value)}
          />
        </label>
        <button
          className={cn(
            buttonVariants(),
            "self-end bg-red-700 hover:bg-red-800 focus-visible:ring-red-600",
          )}
          disabled={isSubmitting}
          type="submit"
        >
          <Ban aria-hidden className="mr-2 h-4 w-4" />
          {isSubmitting ? "처리 중" : "무효 처리"}
        </button>
        {message && (
          <p className="text-sm font-medium text-red-700 md:col-span-2">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}

function SettlementChanges({ changes }: { changes: SettlementChange[] }) {
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
          {formatDateTime(change.createdAt)}
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

function SettlementParticipantSnapshots({
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">참가부스</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">정산 방식</th>
                <th className="px-4 py-3 text-right font-medium">영수증</th>
                <th className="px-4 py-3 text-right font-medium">판매 건수</th>
                <th className="px-4 py-3 text-right font-medium">총매출</th>
                <th className="px-4 py-3 text-right font-medium">판매 수수료</th>
                <th className="px-4 py-3 text-right font-medium">카드 수수료</th>
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

function SettlementMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function PageStateMessage({ message }: { message: string }) {
  return (
    <main className={pageShellClass}>
      <div className={appShellClass}>
        <section className={panelVariants()}>
          <div className="px-4 py-12 text-center text-sm text-zinc-500">
            {message}
          </div>
        </section>
      </div>
    </main>
  );
}

function Toast({
  onDismiss,
  toast,
}: {
  onDismiss: () => void;
  toast: ToastState | null;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm"
      role="status"
    >
      <div className="flex items-start gap-3 rounded-md border border-emerald-700 bg-zinc-950 px-4 py-3 text-white shadow-lg">
        <CheckCircle2
          aria-hidden
          className="mt-0.5 h-5 w-5 flex-none text-emerald-300"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm text-zinc-200">{toast.message}</p>
        </div>
        <button
          aria-label="토스트 닫기"
          className="rounded p-1 text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function getStatusBadgeClass(status: SettlementStatus): string {
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

function formatWon(value: number): string {
  return `${formatMoneyAmount(value)}원`;
}

function formatSignedWon(value: number): string {
  if (value === 0) {
    return formatWon(0);
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatWon(Math.abs(value))}`;
}

function formatMoneyAmount(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace(/\.00$/, "")}%`;
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "요청을 처리하지 못했습니다.";
}
