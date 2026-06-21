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
import {
  getSettlementStatusBadgeClass,
  settlementStatusLabels,
} from "@/features/settlements/lib/settlement-display";
import { cn } from "@/lib/utils";
import {
  appShellClass,
  buttonVariants,
  pageShellClass,
} from "@/lib/design-system";

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
              getSettlementStatusBadgeClass(settlement.status),
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "요청을 처리하지 못했습니다.";
}
