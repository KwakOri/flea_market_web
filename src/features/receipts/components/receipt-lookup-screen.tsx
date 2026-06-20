"use client";

import { useParticipants } from "@/hooks/use-participants";
import { useReceipts } from "@/hooks/use-receipts";
import type { Market } from "@/services/markets.service";
import { ReceiptLookupView } from "@/features/receipts/components/receipt-lookup-view";
import { formatDateRange } from "@/lib/date-format";

export function ReceiptLookupScreen({
  market,
  marketId,
}: {
  market: Market | null;
  marketId: string | null;
}) {
  const participants = useParticipants(marketId);
  const receipts = useReceipts(marketId);

  return (
    <ReceiptLookupView
      dateRangeLabel={formatDateRange(
        market?.startsOn ?? null,
        market?.endsOn ?? null,
      )}
      isLoading={participants.isLoading || receipts.isLoading}
      participants={participants.data ?? []}
      receipts={receipts.data ?? []}
    />
  );
}
