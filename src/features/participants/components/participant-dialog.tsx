"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { ParticipantDialogMode } from "@/stores/dashboard-dialog.store";
import { FeeSettingsFields } from "@/features/fees/components/fee-settings-form";
import {
  defaultFeeSettings,
  getParticipantFeeSettingsDefaults,
} from "@/features/fees/lib/fee-policy";
import { ParticipantPicker } from "@/features/participants/components/participant-picker";
import { ParticipantTypeSelect } from "@/features/participants/components/participant-type-select";
import { buttonVariants } from "@/lib/design-system";
import {
  FLEA_MARKET,
  FLEA_MARKET_DEFAULT_LABEL,
  PARTICIPATING_SELLER,
  PARTICIPATING_SELLER_ADD_LABEL,
  SELLER,
} from "@/lib/terminology";

export function ParticipantDialog({
  editingParticipant,
  feeOverrideEnabled,
  isSubmitting,
  marketName,
  message,
  mode,
  onClose,
  onCreateSubmit,
  onFeeOverrideChange,
  onUpdateSubmit,
  unlinkedParticipants,
}: {
  editingParticipant: Participant | null;
  feeOverrideEnabled: boolean;
  isSubmitting: boolean;
  marketName: string;
  message: string | null;
  mode: ParticipantDialogMode;
  onClose: () => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFeeOverrideChange: (enabled: boolean) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  unlinkedParticipants: Participant[];
}) {
  const isCreateMode = mode === "create";
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const title = isCreateMode
    ? PARTICIPATING_SELLER_ADD_LABEL
    : `이 ${FLEA_MARKET} 참가 설정 수정`;
  const submitLabel = isCreateMode ? `${FLEA_MARKET}에 연결` : "설정 저장";
  const selectedParticipant = isCreateMode
    ? (unlinkedParticipants.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null)
    : editingParticipant;
  const settlementControlsDisabled =
    isSubmitting || (isCreateMode && !selectedParticipant);
  const feeSettingsDefaults = isCreateMode
    ? defaultFeeSettings
    : getParticipantFeeSettingsDefaults(editingParticipant);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 p-4">
      <section
        aria-labelledby="participant-dialog-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[16px] bg-surface-raised shadow-modal"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-3">
          <div>
            <h2
              className="text-base font-semibold text-ink"
              id="participant-dialog-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">{marketName}</p>
          </div>
          <button
            aria-label="닫기"
            className={buttonVariants({ intent: "quiet", size: "sm" })}
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <form
          className="grid gap-4 p-4"
          data-testid="participant-form"
          key={`${mode}-${editingParticipant?.id ?? "new"}`}
          onSubmit={isCreateMode ? onCreateSubmit : onUpdateSubmit}
        >
          {isCreateMode ? (
            <div className="grid gap-3">
              <input
                name="participantId"
                type="hidden"
                value={selectedParticipantId}
              />
              <ParticipantPicker
                disabled={isSubmitting}
                participants={unlinkedParticipants}
                search={participantSearch}
                selectedParticipantId={selectedParticipantId}
                onSearchChange={setParticipantSearch}
                onSelectParticipant={setSelectedParticipantId}
              />
            </div>
          ) : (
            <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_180px]">
              <div className="rounded-md border border-hairline bg-canvas-soft px-3 py-2">
                <p className="text-xs font-medium text-muted">{PARTICIPATING_SELLER}</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {editingParticipant?.displayName ?? `선택된 ${PARTICIPATING_SELLER} 없음`}
                </p>
              </div>
              <ParticipantTypeSelect
                defaultValue={editingParticipant?.participantType ?? "seller"}
                disabled={isSubmitting || !editingParticipant}
              />
            </div>
          )}
          {selectedParticipant ? (
            <>
              {isCreateMode && (
                <div className="grid gap-2 rounded-md border border-hairline bg-canvas-soft p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
                  <div>
                    <p className="text-xs font-medium text-muted">
                      선택된 {PARTICIPATING_SELLER}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {selectedParticipant.displayName}
                    </p>
                  </div>
                  <ParticipantTypeSelect
                    key={selectedParticipant.id}
                    defaultValue={selectedParticipant.participantType}
                    disabled={settlementControlsDisabled}
                  />
                </div>
              )}
              <label className="flex items-center gap-2 rounded-md border border-hairline bg-canvas-soft px-3 py-2 text-sm font-medium text-body">
                <input
                  checked={feeOverrideEnabled}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                  disabled={settlementControlsDisabled}
                  name="feeSettingOverrideEnabled"
                  onChange={(event) => onFeeOverrideChange(event.target.checked)}
                  type="checkbox"
                />
                이 {FLEA_MARKET}에서만 {SELLER}별 수수료 예외 적용
              </label>
              <FeeSettingsFields
                defaultValues={feeSettingsDefaults}
                disabled={settlementControlsDisabled || !feeOverrideEnabled}
              />
            </>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-canvas-soft px-4 py-8 text-center text-sm text-muted">
              {PARTICIPATING_SELLER}를 선택하면 정산 설정을 입력할 수 있습니다.
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              체크하지 않으면 {FLEA_MARKET_DEFAULT_LABEL}, 전체 기본값 순으로 적용됩니다.
              체크한 값은 현재 {FLEA_MARKET}의 {PARTICIPATING_SELLER}에만 저장됩니다.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={buttonVariants({ intent: "secondary" })}
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
              >
                취소
              </button>
              <button
                className={buttonVariants()}
                disabled={
                  isSubmitting ||
                  (isCreateMode && !selectedParticipant) ||
                  (!isCreateMode && !editingParticipant)
                }
                type="submit"
              >
                {isSubmitting ? "저장 중" : submitLabel}
              </button>
            </div>
          </div>
          {message && (
            <p className="text-sm font-medium text-error">{message}</p>
          )}
        </form>
      </section>
    </div>
  );
}
