import { SettlementVersionDetailClient } from "@/app/settlement-version-detail-client";

export default async function SettlementVersionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SettlementVersionDetailClient settlementId={id} />;
}
