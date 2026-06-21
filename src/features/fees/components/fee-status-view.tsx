"use client";

import Link from "next/link";
import type { Participant } from "@/services/participants.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { FeeApplicationMatrix } from "@/features/fees/components/fee-application-matrix";
import { buttonVariants, panelVariants } from "@/lib/design-system";

export function FeeStatusView({
  globalSettings,
  isLoading,
  marketId,
  marketSettings,
  onEditParticipant,
  participants,
}: {
  globalSettings: SettlementDefaultSettings | null;
  isLoading: boolean;
  marketId: string | null;
  marketSettings: SettlementDefaultSettings | null;
  onEditParticipant: (participant: Participant) => void;
  participants: Participant[];
}) {
  return (
    <div className="min-w-0">
      <DashboardPageTitle
        subtitle="전체 → 플리마켓 → 부스 우선순위로 적용되는 정책입니다."
        title="수수료 정책 현황"
      />
      <div className="mb-[22px] flex flex-wrap gap-2">
        <Link
          className={buttonVariants({ intent: "secondary" })}
          href="/settings"
        >
          전체 설정
        </Link>
        <Link
          className={buttonVariants({ intent: "secondary" })}
          href={`/markets/${marketId}/management`}
        >
          플리마켓 설정
        </Link>
      </div>
      <section className={panelVariants()}>
        <FeeApplicationMatrix
          globalSettings={globalSettings}
          isLoading={isLoading}
          marketSettings={marketSettings}
          participants={participants}
          onEditParticipant={onEditParticipant}
        />
      </section>
    </div>
  );
}
