import { DashboardClient } from "@/app/dashboard-client";

export default async function MarketReceiptEditPage({
  params,
}: {
  params: Promise<{ id: string; receiptId: string }>;
}) {
  const { id, receiptId } = await params;

  return (
    <DashboardClient marketId={id} receiptId={receiptId} view="receiptEdit" />
  );
}
