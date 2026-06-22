"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParticipants } from "@/hooks/use-participants";
import { useDeleteReceipt, useReceipts } from "@/hooks/use-receipts";
import type { Market } from "@/services/markets.service";
import type { Receipt } from "@/services/receipts.service";
import { ReceiptLookupView } from "@/features/receipts/components/receipt-lookup-view";
import { formatDateRange } from "@/lib/date-format";
import { getErrorMessage } from "@/lib/error-message";
import { formatWon } from "@/lib/money";

export function ReceiptLookupScreen({
  market,
  marketId,
  onSaved,
}: {
  market: Market | null;
  marketId: string | null;
  onSaved: (title: string, message: string) => void;
}) {
  const router = useRouter();
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const participants = useParticipants(marketId);
  const receipts = useReceipts(marketId);
  const deleteReceipt = useDeleteReceipt(marketId);

  function handleEditReceipt(receipt: Receipt) {
    if (!marketId) {
      return;
    }

    router.push(`/markets/${marketId}/receipts/${receipt.id}/edit`);
  }

  async function handleDeleteReceipt(receipt: Receipt) {
    setReceiptMessage(null);

    const receiptLabel = receipt.receiptNo ?? receipt.id;
    const confirmed = window.confirm(
      `영수증 ${receiptLabel} (${formatWon(
        receipt.totalAmount,
      )})을 삭제할까요? 삭제한 영수증은 정산 금액에서도 제외됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteReceipt.mutateAsync(receipt.id);
      onSaved(
        "영수증 삭제 완료",
        `영수증 ${receiptLabel}을 삭제했습니다.`,
      );
    } catch (error) {
      setReceiptMessage(getErrorMessage(error));
    }
  }

  return (
    <ReceiptLookupView
      dateRangeLabel={formatDateRange(
        market?.startsOn ?? null,
        market?.endsOn ?? null,
      )}
      isDeletingReceipt={deleteReceipt.isPending}
      isLoading={participants.isLoading || receipts.isLoading}
      participants={participants.data ?? []}
      receiptMessage={receiptMessage}
      receipts={receipts.data ?? []}
      onDeleteReceipt={handleDeleteReceipt}
      onEditReceipt={handleEditReceipt}
    />
  );
}
