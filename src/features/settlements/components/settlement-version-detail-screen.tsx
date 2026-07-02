"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  useSettlement,
  useVoidSettlement,
} from "@/hooks/use-settlement-preview";
import {
  DashboardToast,
  type ToastState,
} from "@/features/dashboard/components/dashboard-toast";
import { PageStateMessage } from "@/features/dashboard/components/page-state-message";
import { SettlementParticipantSnapshots } from "@/features/settlements/components/settlement-participant-snapshots";
import { SettlementChanges } from "@/features/settlements/components/settlement-version-changes";
import { SettlementManagement } from "@/features/settlements/components/settlement-version-management";
import { SettlementSummary } from "@/features/settlements/components/settlement-version-summary";
import { settlementStatusLabels } from "@/features/settlements/lib/settlement-display";
import { cn } from "@/lib/utils";
import { appShellClass, pageShellClass } from "@/lib/design-system";

type SettlementVersionDetailScreenProps = {
  marketId?: string;
  settlementId: string;
};

export function SettlementVersionDetailScreen({
  marketId,
  settlementId,
}: SettlementVersionDetailScreenProps) {
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
        <div className="mx-auto w-full max-w-[1120px]">
          <button
            className="mb-4 inline-flex items-center gap-[7px] text-muted transition hover:text-ink"
            onClick={handleBack}
            type="button"
          >
            <ArrowLeft aria-hidden className="h-[17px] w-[17px]" />
            <span className="mono text-[12px] font-semibold tracking-[0.02em]">
              정산 목록
            </span>
          </button>

          <div className="mb-[22px] flex flex-col gap-[18px] sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="dsp num m-0 text-[32px] font-bold leading-tight tracking-[-0.025em] text-ink">
                v{settlement.versionNo} 정산
              </h1>
              <p className="mt-[7px] text-[13.5px] text-muted">
                확정된 정산 회차의 기준 데이터와 변경 내역을 확인합니다.
              </p>
            </div>
            <span
              className={cn(
                "mt-1 inline-flex w-fit flex-none items-center gap-[7px] rounded-full border px-[13px] py-1.5",
                getSettlementStatusPillClass(settlement.status),
              )}
            >
              <span
                className={cn(
                  "h-[7px] w-[7px] rounded-full",
                  settlement.status === "voided"
                    ? "bg-error"
                    : "bg-success",
                )}
              />
              <span className="mono text-[11.5px] font-bold tracking-[0.04em]">
                {settlementStatusLabels[settlement.status]}
              </span>
            </span>
          </div>

          <div className="grid gap-6">
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
          </div>
        </div>
        <DashboardToast
          toast={toast}
          onDismiss={() => {
            setToast(null);
          }}
        />
      </div>
    </main>
  );
}

function getSettlementStatusPillClass(status: string): string {
  if (status === "voided") {
    return "border-error/40 bg-error-tint text-error";
  }

  return "border-success/40 bg-success-tint text-success";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "요청을 처리하지 못했습니다.";
}
