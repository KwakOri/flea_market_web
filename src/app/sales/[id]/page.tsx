import { redirect } from "next/navigation";

export default async function SalesMarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/markets/${id}/sales`);
}
