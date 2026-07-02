"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useCreateParticipantMaster,
  useParticipantMasters,
  useUpdateParticipantMaster,
} from "@/hooks/use-participants";
import type {
  Participant,
  ParticipantStatus,
  ParticipantType,
} from "@/services/participants.service";
import { useDashboardDialogStore } from "@/stores/dashboard-dialog.store";
import { BoothMasterManagementView } from "@/features/participants/components/booth-master-management-view";
import { getErrorMessage } from "@/lib/error-message";
import {
  getFormString,
  getNullableFormString,
  getOptionalFormString,
} from "@/lib/form-data";
import { SELLER, SELLER_NAME_LABEL } from "@/lib/terminology";

export function BoothMasterManagementScreen({
  enabled,
}: {
  enabled: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const participantMasters = useParticipantMasters(enabled);
  const createParticipantMaster = useCreateParticipantMaster();
  const updateParticipantMaster = useUpdateParticipantMaster();
  const participantMasterDialogMode = useDashboardDialogStore(
    (state) => state.participantMasterDialogMode,
  );
  const editingParticipantMasterId = useDashboardDialogStore(
    (state) => state.editingParticipantMasterId,
  );
  const openCreateParticipantMasterDialogState = useDashboardDialogStore(
    (state) => state.openCreateParticipantMasterDialog,
  );
  const openEditParticipantMasterDialogState = useDashboardDialogStore(
    (state) => state.openEditParticipantMasterDialog,
  );
  const closeParticipantMasterDialogState = useDashboardDialogStore(
    (state) => state.closeParticipantMasterDialog,
  );
  const editingParticipantMaster = useMemo(
    () =>
      participantMasters.data?.find(
        (participant) => participant.id === editingParticipantMasterId,
      ) ?? null,
    [editingParticipantMasterId, participantMasters.data],
  );

  async function handleCreateParticipantMaster(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const displayName = getFormString(formData, "displayName");

    if (!displayName.trim()) {
      setMessage(`${SELLER_NAME_LABEL}을 입력해주세요.`);
      return;
    }

    try {
      await createParticipantMaster.mutateAsync({
        displayName,
        participantType: getFormString(
          formData,
          "participantType",
        ) as ParticipantType,
        contactName: getOptionalFormString(formData, "contactName"),
        phone: getOptionalFormString(formData, "phone"),
        email: getOptionalFormString(formData, "email"),
        memo: getOptionalFormString(formData, "memo"),
      });

      form.reset();
      closeParticipantMasterDialog();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateParticipantMaster(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage(null);

    if (!editingParticipantMaster) {
      setMessage(`수정할 ${SELLER}를 선택해주세요.`);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const displayName = getFormString(formData, "displayName");

    if (!displayName.trim()) {
      setMessage(`${SELLER_NAME_LABEL}을 입력해주세요.`);
      return;
    }

    try {
      await updateParticipantMaster.mutateAsync({
        participantId: editingParticipantMaster.id,
        payload: {
          displayName,
          participantType: getFormString(
            formData,
            "participantType",
          ) as ParticipantType,
          contactName: getNullableFormString(formData, "contactName"),
          phone: getNullableFormString(formData, "phone"),
          email: getNullableFormString(formData, "email"),
          memo: getNullableFormString(formData, "memo"),
          status: getFormString(formData, "status") as ParticipantStatus,
        },
      });

      closeParticipantMasterDialog();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function openCreateParticipantMasterDialog() {
    setMessage(null);
    openCreateParticipantMasterDialogState();
  }

  function openEditParticipantMasterDialog(participant: Participant) {
    setMessage(null);
    openEditParticipantMasterDialogState(participant.id);
  }

  function closeParticipantMasterDialog() {
    closeParticipantMasterDialogState();
    setMessage(null);
  }

  return (
    <BoothMasterManagementView
      createDisabled={createParticipantMaster.isPending}
      dialogMode={participantMasterDialogMode}
      editingParticipant={editingParticipantMaster}
      isSubmitting={
        createParticipantMaster.isPending || updateParticipantMaster.isPending
      }
      message={message}
      participants={participantMasters.data ?? []}
      onCloseDialog={closeParticipantMasterDialog}
      onCreate={openCreateParticipantMasterDialog}
      onCreateSubmit={handleCreateParticipantMaster}
      onEditParticipant={openEditParticipantMasterDialog}
      onUpdateSubmit={handleUpdateParticipantMaster}
    />
  );
}
