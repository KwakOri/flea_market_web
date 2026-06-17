import { redirect } from "next/navigation";

export default async function SettlementsMarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/markets/${id}/settlements`);
}
