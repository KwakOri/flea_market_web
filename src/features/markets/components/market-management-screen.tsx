"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateMarket,
  useMarkets,
  useUpdateMarket,
} from "@/hooks/use-markets";
import {
  useMarketSettlementSettings,
  useUpdateMarketSettlementSettings,
} from "@/hooks/use-settlement-settings";
import type { Market, MarketStatus } from "@/services/markets.service";
import { useDashboardDialogStore } from "@/stores/dashboard-dialog.store";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import { getFeeSettingsPayload } from "@/features/fees/lib/fee-settings-payload";
import { MarketDialog } from "@/features/markets/components/market-dialog";
import { MarketManagementView } from "@/features/markets/components/market-management-view";
import { getErrorMessage } from "@/lib/error-message";
import {
  getFormString,
  getOptionalFormString,
} from "@/lib/form-data";

export function MarketManagementScreen({
  enabled,
  marketId,
  onSaved,
}: {
  enabled: boolean;
  marketId: string | null;
  onSaved: (title: string, message: string) => void;
}) {
  const router = useRouter();
  const [marketMessage, setMarketMessage] = useState<string | null>(null);
  const [marketFeeSettingsMessage, setMarketFeeSettingsMessage] = useState<
    string | null
  >(null);
  const markets = useMarkets(enabled);
  const createMarket = useCreateMarket();
  const updateMarket = useUpdateMarket();
  const marketFeeSettings = useMarketSettlementSettings(marketId);
  const updateMarketFeeSettings = useUpdateMarketSettlementSettings(marketId);
  const marketDialogMode = useDashboardDialogStore(
    (state) => state.marketDialogMode,
  );
  const editingMarketId = useDashboardDialogStore(
    (state) => state.editingMarketId,
  );
  const openCreateMarketDialogState = useDashboardDialogStore(
    (state) => state.openCreateMarketDialog,
  );
  const openEditMarketDialogState = useDashboardDialogStore(
    (state) => state.openEditMarketDialog,
  );
  const closeMarketDialogState = useDashboardDialogStore(
    (state) => state.closeMarketDialog,
  );
  const setRequestedParticipantId = useDashboardUiStore(
    (state) => state.setRequestedParticipantId,
  );
  const selectedMarket = useMemo(
    () => markets.data?.find((market) => market.id === marketId) ?? null,
    [marketId, markets.data],
  );
  const editingMarket = useMemo(
    () => markets.data?.find((market) => market.id === editingMarketId) ?? null,
    [editingMarketId, markets.data],
  );

  async function handleCreateMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMarketMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const market = await createMarket.mutateAsync({
        name: getFormString(formData, "name"),
        description: getOptionalFormString(formData, "description"),
        startsOn: getOptionalFormString(formData, "startsOn"),
        endsOn: getOptionalFormString(formData, "endsOn"),
      });

      setRequestedParticipantId(null);
      form.reset();
      closeMarketDialog();
      router.push(`/markets/${market.id}/management`);
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMarketMessage(null);

    if (!editingMarket) {
      setMarketMessage("수정할 플리마켓을 선택해주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = getFormString(formData, "name");

    if (!name.trim()) {
      setMarketMessage("마켓명을 입력해주세요.");
      return;
    }

    try {
      await updateMarket.mutateAsync({
        marketId: editingMarket.id,
        payload: {
          name,
          description: getFormString(formData, "description").trim(),
          status: getFormString(formData, "status") as MarketStatus,
          startsOn: getOptionalFormString(formData, "startsOn"),
          endsOn: getOptionalFormString(formData, "endsOn"),
        },
      });
      closeMarketDialog();
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
  }

  function openCreateMarketDialog() {
    setMarketMessage(null);
    openCreateMarketDialogState();
  }

  function openEditMarketDialog(market: Market) {
    setMarketMessage(null);
    openEditMarketDialogState(market.id);
  }

  function closeMarketDialog() {
    closeMarketDialogState();
    setMarketMessage(null);
  }

  async function handleUpdateMarketFeeSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMarketFeeSettingsMessage(null);

    try {
      await updateMarketFeeSettings.mutateAsync(
        getFeeSettingsPayload(new FormData(event.currentTarget)),
      );
      onSaved(
        "플리마켓 수수료 저장 완료",
        "플리마켓 수수료 기본값을 저장했습니다.",
      );
    } catch (error) {
      setMarketFeeSettingsMessage(getErrorMessage(error));
    }
  }

  return (
    <>
      <MarketManagementView
        createMarketDisabled={createMarket.isPending}
        marketFeeSettings={marketFeeSettings.data}
        marketFeeSettingsDisabled={
          marketFeeSettings.isLoading || updateMarketFeeSettings.isPending
        }
        marketFeeSettingsMessage={marketFeeSettingsMessage}
        marketFeeSettingsSubmitLabel={
          updateMarketFeeSettings.isPending ? "저장 중" : "저장"
        }
        marketId={marketId}
        marketMessage={marketMessage}
        markets={markets.data ?? []}
        selectedMarket={selectedMarket}
        onCreateMarket={openCreateMarketDialog}
        onEditMarket={openEditMarketDialog}
        onSelectMarket={(selectedId) =>
          router.push(`/markets/${selectedId}/management`)
        }
        onUpdateMarketFeeSettings={handleUpdateMarketFeeSettings}
      />
      {marketDialogMode && (
        <MarketDialog
          editingMarket={editingMarket}
          isSubmitting={createMarket.isPending || updateMarket.isPending}
          message={marketMessage}
          mode={marketDialogMode}
          onClose={closeMarketDialog}
          onCreateSubmit={handleCreateMarket}
          onUpdateSubmit={handleUpdateMarket}
        />
      )}
    </>
  );
}
