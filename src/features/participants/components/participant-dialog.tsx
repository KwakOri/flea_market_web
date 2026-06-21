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
    ? "참가부스 추가"
    : "이 플리마켓 참가 설정 수정";
  const submitLabel = isCreateMode ? "마켓에 연결" : "설정 저장";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
      <section
        aria-labelledby="participant-dialog-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div>
            <h2
              className="text-base font-semibold text-zinc-950"
              id="participant-dialog-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{marketName}</p>
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
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs font-medium text-zinc-500">참가부스</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">
                  {editingParticipant?.displayName ?? "선택된 참가부스 없음"}
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
                <div className="grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      선택된 참가부스
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-950">
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
              <label className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                <input
                  checked={feeOverrideEnabled}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
                  disabled={settlementControlsDisabled}
                  name="feeSettingOverrideEnabled"
                  onChange={(event) => onFeeOverrideChange(event.target.checked)}
                  type="checkbox"
                />
                이 플리마켓에서만 부스별 수수료 예외 적용
              </label>
              <FeeSettingsFields
                defaultValues={feeSettingsDefaults}
                disabled={settlementControlsDisabled || !feeOverrideEnabled}
              />
            </>
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              참가부스를 선택하면 정산 설정을 입력할 수 있습니다.
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              체크하지 않으면 플리마켓 기본값, 전체 기본값 순으로 적용됩니다.
              체크한 값은 현재 플리마켓의 참가부스에만 저장됩니다.
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
            <p className="text-sm font-medium text-red-700">{message}</p>
          )}
        </form>
      </section>
    </div>
  );
}
