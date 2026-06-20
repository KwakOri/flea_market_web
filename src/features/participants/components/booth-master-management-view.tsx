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
          <h2 className={sectionTitleClass}>부스</h2>
          <p className={sectionDescriptionClass}>
            플리마켓에 연결하기 전의 부스 기본 정보를 관리합니다.
          </p>
        </div>
        <button
          className={buttonVariants()}
          disabled={createDisabled}
          onClick={onCreate}
          type="button"
        >
          <Plus aria-hidden className="mr-2 h-4 w-4" />
          부스 추가
        </button>
      </div>
      {message && (
        <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
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
