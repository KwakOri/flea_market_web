"use client";

import { useParticipants } from "@/hooks/use-participants";
import {
  useGlobalSettlementSettings,
  useMarketSettlementSettings,
} from "@/hooks/use-settlement-settings";
import type { Participant } from "@/services/participants.service";
import { FeeStatusView } from "@/features/fees/components/fee-status-view";

export function FeeStatusScreen({
  marketId,
  onEditParticipant,
}: {
  marketId: string | null;
  onEditParticipant: (participant: Participant) => void;
}) {
  const globalSettings = useGlobalSettlementSettings(true);
  const marketSettings = useMarketSettlementSettings(marketId);
  const participants = useParticipants(marketId);

  return (
    <FeeStatusView
      globalSettings={globalSettings.data ?? null}
      isLoading={
        globalSettings.isLoading ||
        marketSettings.isLoading ||
        participants.isLoading
      }
      marketId={marketId}
      marketSettings={marketSettings.data ?? null}
      participants={participants.data ?? []}
      onEditParticipant={onEditParticipant}
    />
  );
}
