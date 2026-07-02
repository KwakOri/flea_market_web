"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useDeleteParticipantFromMarket,
  useParticipantMasters,
  useParticipants,
} from "@/hooks/use-participants";
import {
  useCreateProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/use-products";
import {
  useGlobalSettlementSettings,
  useMarketSettlementSettings,
} from "@/hooks/use-settlement-settings";
import type { Market } from "@/services/markets.service";
import type { Participant } from "@/services/participants.service";
import type { ProductStatus } from "@/services/products.service";
import { useDashboardDialogStore } from "@/stores/dashboard-dialog.store";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import { BoothProductManagementView } from "@/features/participants/components/booth-product-management-view";
import { getErrorMessage } from "@/lib/error-message";
import {
  getFormString,
  getOptionalFormString,
  getRequiredNumber,
} from "@/lib/form-data";
import { FLEA_MARKET, PARTICIPATING_SELLER, SELLER } from "@/lib/terminology";

export function BoothProductManagementScreen({
  market,
  marketId,
}: {
  market: Market | null;
  marketId: string | null;
}) {
  const [participantMessage, setParticipantMessage] = useState<string | null>(
    null,
  );
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const requestedParticipantId = useDashboardUiStore(
    (state) => state.requestedParticipantId,
  );
  const setRequestedParticipantId = useDashboardUiStore(
    (state) => state.setRequestedParticipantId,
  );
  const participantDialogMode = useDashboardDialogStore(
    (state) => state.participantDialogMode,
  );
  const openCreateParticipantDialogState = useDashboardDialogStore(
    (state) => state.openCreateParticipantDialog,
  );
  const openEditParticipantDialogState = useDashboardDialogStore(
    (state) => state.openEditParticipantDialog,
  );
  const participants = useParticipants(marketId);
  const participantMasters = useParticipantMasters(Boolean(marketId));
  const selectedParticipantId = useMemo(() => {
    if (!participants.data?.length) {
      return null;
    }

    const requestedParticipant = participants.data.find(
      (participant) => participant.id === requestedParticipantId,
    );

    return requestedParticipant?.id ?? participants.data[0].id;
  }, [participants.data, requestedParticipantId]);
  const selectedParticipant = useMemo(
    () =>
      participants.data?.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null,
    [participants.data, selectedParticipantId],
  );
  const linkedParticipantIds = useMemo(
    () =>
      new Set(
        (participants.data ?? []).map((participant) => participant.id),
      ),
    [participants.data],
  );
  const unlinkedParticipantMasters = useMemo(() => {
    return (participantMasters.data ?? []).filter(
      (participant) => !linkedParticipantIds.has(participant.id),
    );
  }, [linkedParticipantIds, participantMasters.data]);
  const deleteParticipantFromMarket = useDeleteParticipantFromMarket(marketId);
  const products = useProducts(marketId, selectedParticipantId);
  const createProduct = useCreateProduct(marketId, selectedParticipantId);
  const updateProduct = useUpdateProduct(marketId, selectedParticipantId);
  const globalFeeSettings = useGlobalSettlementSettings(true);
  const marketFeeSettings = useMarketSettlementSettings(marketId);

  async function handleDeleteParticipantFromMarket(participant: Participant) {
    setParticipantMessage(null);

    const confirmed = window.confirm(
      `${participant.displayName} ${PARTICIPATING_SELLER}를 이 ${FLEA_MARKET}에서 삭제할까요? 전체 ${SELLER} 정보는 유지됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteParticipantFromMarket.mutateAsync(participant.id);

      setRequestedParticipantId((currentParticipantId) =>
        currentParticipantId === participant.id ? null : currentParticipantId,
      );
    } catch (error) {
      setParticipantMessage(getErrorMessage(error));
    }
  }

  function openCreateParticipantDialog() {
    setParticipantMessage(null);
    openCreateParticipantDialogState();
  }

  function openEditParticipantDialog(participant: Participant) {
    setParticipantMessage(null);
    setRequestedParticipantId(participant.id);
    openEditParticipantDialogState(
      participant.id,
      participant.settings?.feeSettingOverrideEnabled === true,
    );
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await createProduct.mutateAsync({
        name: getFormString(formData, "name"),
        sku: getOptionalFormString(formData, "sku"),
        priceAmount: getRequiredNumber(
          formData,
          "priceAmount",
          "가격을 입력해주세요.",
        ),
      });

      form.reset();
    } catch (error) {
      setProductMessage(getErrorMessage(error));
    }
  }

  async function handleProductStatusChange(
    productId: string,
    status: ProductStatus,
  ) {
    setProductMessage(null);

    try {
      await updateProduct.mutateAsync({
        productId,
        payload: { status },
      });
    } catch (error) {
      setProductMessage(getErrorMessage(error));
    }
  }

  return (
    <BoothProductManagementView
      createParticipantDisabled={
        !market || !unlinkedParticipantMasters.length
      }
      createProductDisabled={!selectedParticipant || createProduct.isPending}
      deleteParticipantDisabled={deleteParticipantFromMarket.isPending}
      globalSettings={globalFeeSettings.data ?? null}
      marketSettings={marketFeeSettings.data ?? null}
      participants={participants.data ?? []}
      participantDialogOpen={Boolean(participantDialogMode)}
      participantMessage={participantMessage}
      products={products.data ?? []}
      productMessage={productMessage}
      selectedMarket={market}
      selectedParticipant={selectedParticipant}
      selectedParticipantId={selectedParticipantId}
      onCreateParticipant={openCreateParticipantDialog}
      onCreateProductSubmit={handleCreateProduct}
      onDeleteParticipant={handleDeleteParticipantFromMarket}
      onEditParticipant={openEditParticipantDialog}
      onProductStatusChange={handleProductStatusChange}
    />
  );
}
