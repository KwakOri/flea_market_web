import { SettlementVersionDetailClient } from "@/app/settlement-version-detail-client";

export default async function MarketSettlementVersionPage({
  params,
}: {
  params: Promise<{ id: string; settlementId: string }>;
}) {
  const { id, settlementId } = await params;

  return (
    <SettlementVersionDetailClient marketId={id} settlementId={settlementId} />
  );
}
