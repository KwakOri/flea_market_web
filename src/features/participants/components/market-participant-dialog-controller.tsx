"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useCreateParticipant,
  useParticipantMasters,
  useParticipants,
  useUpdateParticipantForMarket,
} from "@/hooks/use-participants";
import type { ParticipantType } from "@/services/participants.service";
import { useDashboardDialogStore } from "@/stores/dashboard-dialog.store";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import { getFeeSettingsPayload } from "@/features/fees/lib/fee-settings-payload";
import { ParticipantDialog } from "@/features/participants/components/participant-dialogs";
import { getErrorMessage } from "@/lib/error-message";
import {
  getCheckboxValue,
  getFormString,
  getOptionalFormString,
} from "@/lib/form-data";
import { PARTICIPATING_SELLER } from "@/lib/terminology";

export function MarketParticipantDialogController({
  enabled,
  marketId,
  marketName,
}: {
  enabled: boolean;
  marketId: string | null;
  marketName: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const participants = useParticipants(marketId);
  const participantMasters = useParticipantMasters(enabled);
  const createParticipant = useCreateParticipant(marketId);
  const updateParticipantForMarket = useUpdateParticipantForMarket(marketId);
  const participantFeeOverrideEnabled = useDashboardDialogStore(
    (state) => state.participantFeeOverrideEnabled,
  );
  const participantDialogMode = useDashboardDialogStore(
    (state) => state.participantDialogMode,
  );
  const editingParticipantId = useDashboardDialogStore(
    (state) => state.editingParticipantId,
  );
  const closeParticipantDialogState = useDashboardDialogStore(
    (state) => state.closeParticipantDialog,
  );
  const setParticipantFeeOverrideEnabled = useDashboardDialogStore(
    (state) => state.setParticipantFeeOverrideEnabled,
  );
  const setRequestedParticipantId = useDashboardUiStore(
    (state) => state.setRequestedParticipantId,
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
  const editingParticipant = useMemo(
    () =>
      participants.data?.find(
        (participant) => participant.id === editingParticipantId,
      ) ?? null,
    [editingParticipantId, participants.data],
  );

  async function handleCreateParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const participantId = getOptionalFormString(formData, "participantId");

    if (!participantId) {
      setMessage(`연결할 ${PARTICIPATING_SELLER}를 선택해주세요.`);
      return;
    }

    try {
      const feeSettingOverrideEnabled = getCheckboxValue(
        formData,
        "feeSettingOverrideEnabled",
      );
      const participant = await createParticipant.mutateAsync({
        participantId,
        participantType: getFormString(
          formData,
          "participantType",
        ) as ParticipantType,
        feeSettingOverrideEnabled,
        ...(feeSettingOverrideEnabled ? getFeeSettingsPayload(formData) : {}),
      });

      setRequestedParticipantId(participant.id);
      form.reset();
      closeParticipantDialog();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!editingParticipant) {
      setMessage(`수정할 ${PARTICIPATING_SELLER}를 선택해주세요.`);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const feeSettingOverrideEnabled = getCheckboxValue(
      formData,
      "feeSettingOverrideEnabled",
    );

    try {
      const participant = await updateParticipantForMarket.mutateAsync({
        participantId: editingParticipant.id,
        payload: {
          participantType: getFormString(
            formData,
            "participantType",
          ) as ParticipantType,
          feeSettingOverrideEnabled,
          ...(feeSettingOverrideEnabled ? getFeeSettingsPayload(formData) : {}),
        },
      });

      setRequestedParticipantId(participant.id);
      closeParticipantDialog();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function closeParticipantDialog() {
    closeParticipantDialogState();
    setMessage(null);
  }

  if (!participantDialogMode) {
    return null;
  }

  return (
    <ParticipantDialog
      editingParticipant={editingParticipant}
      feeOverrideEnabled={participantFeeOverrideEnabled}
      isSubmitting={
        createParticipant.isPending || updateParticipantForMarket.isPending
      }
      marketName={marketName}
      message={message}
      mode={participantDialogMode}
      unlinkedParticipants={unlinkedParticipantMasters}
      onClose={closeParticipantDialog}
      onCreateSubmit={handleCreateParticipant}
      onFeeOverrideChange={setParticipantFeeOverrideEnabled}
      onUpdateSubmit={handleUpdateParticipant}
    />
  );
}
