import { redirect } from "next/navigation";

export default async function BoothsMarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/markets/${id}/booths`);
}
