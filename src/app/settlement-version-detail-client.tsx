"use client";

import { SettlementVersionDetailScreen } from "@/features/settlements/components/settlement-version-detail-screen";

type SettlementVersionDetailClientProps = {
  marketId?: string;
  settlementId: string;
};

export function SettlementVersionDetailClient({
  marketId,
  settlementId,
}: SettlementVersionDetailClientProps) {
  return (
    <SettlementVersionDetailScreen
      marketId={marketId}
      settlementId={settlementId}
    />
  );
}
