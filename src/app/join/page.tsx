import { JoinClient } from "./join-client";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;

  return <JoinClient token={typeof token === "string" ? token : ""} />;
}
