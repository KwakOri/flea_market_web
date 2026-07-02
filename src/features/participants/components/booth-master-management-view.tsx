import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { ParticipantMasterDialogMode } from "@/stores/dashboard-dialog.store";
import { ParticipantMasterTable } from "@/features/participants/components/participant-master-table";
import { ParticipantMasterDialog } from "@/features/participants/components/participant-dialogs";
import {
  buttonVariants,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";
import { FLEA_MARKET, SELLER, SELLER_ADD_LABEL } from "@/lib/terminology";
import { cn } from "@/lib/utils";

export function BoothMasterManagementView({
  createDisabled,
  dialogMode,
  editingParticipant,
  isSubmitting,
  message,
  participants,
  onCloseDialog,
  onCreate,
  onCreateSubmit,
  onEditParticipant,
  onUpdateSubmit,
}: {
  createDisabled: boolean;
  dialogMode: ParticipantMasterDialogMode | null;
  editingParticipant: Participant | null;
  isSubmitting: boolean;
  message: string | null;
  participants: Participant[];
  onCloseDialog: () => void;
  onCreate: () => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditParticipant: (participant: Participant) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className={panelVariants()}>
      <div
        className={cn(
          sectionHeaderClass,
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div>
          <h2 className={sectionTitleClass}>{SELLER}</h2>
          <p className={sectionDescriptionClass}>
            {FLEA_MARKET}에 연결하기 전의 {SELLER} 기본 정보를 관리합니다.
          </p>
        </div>
        <button
          className={buttonVariants()}
          disabled={createDisabled}
          onClick={onCreate}
          type="button"
        >
          <Plus aria-hidden className="mr-2 h-4 w-4" />
          {SELLER_ADD_LABEL}
        </button>
      </div>
      {message && (
        <p className="border-b border-hairline px-4 py-2 text-sm font-medium text-error">
          {message}
        </p>
      )}
      <ParticipantMasterTable
        participants={participants}
        showLinkStatus={false}
        onEditParticipant={onEditParticipant}
      />
      {dialogMode && (
        <ParticipantMasterDialog
          editingParticipant={editingParticipant}
          isSubmitting={isSubmitting}
          message={message}
          mode={dialogMode}
          onClose={onCloseDialog}
          onCreateSubmit={onCreateSubmit}
          onUpdateSubmit={onUpdateSubmit}
        />
      )}
    </section>
  );
}
