import { DashboardClient } from "@/app/dashboard-client";

export default async function MarketSettlementParticipantPage({
  params,
}: {
  params: Promise<{ id: string; participantId: string }>;
}) {
  const { id, participantId } = await params;

  return (
    <DashboardClient
      marketId={id}
      settlementParticipantId={participantId}
      view="settlements"
    />
  );
}
