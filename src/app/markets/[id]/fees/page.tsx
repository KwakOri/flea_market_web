import { DashboardClient } from "@/app/dashboard-client";

export default async function MarketFeeStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DashboardClient marketId={id} view="feeStatus" />;
}
