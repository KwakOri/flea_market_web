import { DashboardClient } from "@/app/dashboard-client";

export default async function MarketBoothsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DashboardClient marketId={id} view="booths" />;
}
