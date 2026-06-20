"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import type {
  Participant,
  ParticipantType,
} from "@/services/participants.service";
import type {
  ParticipantDialogMode,
  ParticipantMasterDialogMode,
} from "@/stores/dashboard-dialog.store";
import { FeeSettingsFields } from "@/features/fees/components/fee-settings-form";
import {
  defaultFeeSettings,
  getParticipantFeeSettingsDefaults,
} from "@/features/fees/lib/fee-policy";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
import { buttonVariants, inputClass, selectClass } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function ParticipantMasterDialog({
  editingParticipant,
  isSubmitting,
  message,
  mode,
  onClose,
  onCreateSubmit,
  onUpdateSubmit,
}: {
  editingParticipant: Participant | null;
  isSubmitting: boolean;
  message: string | null;
  mode: ParticipantMasterDialogMode;
  onClose: () => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isCreateMode = mode === "create";
  const title = isCreateMode ? "부스 추가" : "부스 관리";
  const submitLabel = isCreateMode ? "추가" : "저장";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
      <section
        aria-labelledby="participant-master-dialog-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div>
            <h2
              className="text-base font-semibold text-zinc-950"
              id="participant-master-dialog-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              부스 기본 정보와 연락처
            </p>
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
          data-testid="participant-master-form"
          key={`${mode}-${editingParticipant?.id ?? "new"}`}
          onSubmit={isCreateMode ? onCreateSubmit : onUpdateSubmit}
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              부스명
              <input
                className={inputClass}
                defaultValue={editingParticipant?.displayName ?? ""}
                disabled={isSubmitting}
                name="displayName"
                placeholder="부스명"
                required
                type="text"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              유형
              <select
                className={selectClass}
                defaultValue={editingParticipant?.participantType ?? "seller"}
                disabled={isSubmitting}
                name="participantType"
              >
                <option value="seller">셀러</option>
                <option value="staff">운영진</option>
                <option value="special_booth">특수 부스</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              담당자
              <input
                className={inputClass}
                defaultValue={editingParticipant?.contactName ?? ""}
                disabled={isSubmitting}
                name="contactName"
                placeholder="담당자"
                type="text"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              연락처
              <input
                className={inputClass}
                defaultValue={editingParticipant?.phone ?? ""}
                disabled={isSubmitting}
                name="phone"
                placeholder="010-0000-0000"
                type="tel"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600 sm:col-span-2">
              이메일
              <input
                className={inputClass}
                defaultValue={editingParticipant?.email ?? ""}
                disabled={isSubmitting}
                name="email"
                placeholder="email@example.com"
                type="email"
              />
            </label>
          </div>
          {!isCreateMode && (
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              상태
              <select
                className={selectClass}
                defaultValue={editingParticipant?.status ?? "active"}
                disabled={isSubmitting || !editingParticipant}
                name="status"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </label>
          )}
          <label className="grid gap-1 text-xs font-medium text-zinc-600">
            메모
            <textarea
              className={cn(inputClass, "min-h-24 resize-none py-2")}
              defaultValue={editingParticipant?.memo ?? ""}
              disabled={isSubmitting}
              name="memo"
              placeholder="메모"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              부스 기본 정보는 플리마켓 참가 설정에서 다시 연결해 사용합니다.
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
                disabled={isSubmitting || (!isCreateMode && !editingParticipant)}
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

function ParticipantPicker({
  disabled,
  participants,
  search,
  selectedParticipantId,
  onSearchChange,
  onSelectParticipant,
}: {
  disabled: boolean;
  participants: Participant[];
  search: string;
  selectedParticipantId: string;
  onSearchChange: (search: string) => void;
  onSelectParticipant: (participantId: string) => void;
}) {
  const filteredParticipants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return participants;
    }

    return participants.filter((participant) => {
      const searchableText = [
        participant.displayName,
        participant.contactName,
        participant.phone,
        participant.email,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [participants, search]);

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        참가부스 검색
        <input
          className={inputClass}
          disabled={disabled || participants.length === 0}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          placeholder="부스명, 담당자, 연락처 검색"
          type="search"
          value={search}
        />
      </label>
      <div className="max-h-72 overflow-y-auto rounded-md border border-zinc-200 bg-white">
        {participants.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            연결 가능한 참가부스가 없습니다.
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredParticipants.map((participant) => {
              const isSelected = participant.id === selectedParticipantId;
              const secondaryText = [
                participant.contactName,
                participant.phone,
                participant.email,
              ]
                .filter((value): value is string => Boolean(value))
                .join(" · ");

              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "grid w-full gap-2 px-4 py-3 text-left transition hover:bg-emerald-50/60",
                    isSelected && "bg-emerald-50 ring-1 ring-inset ring-emerald-300",
                  )}
                  disabled={disabled}
                  key={participant.id}
                  onClick={() => onSelectParticipant(participant.id)}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-zinc-950">
                        {participant.displayName}
                      </span>
                      {secondaryText && (
                        <span className="mt-1 block truncate text-xs text-zinc-500">
                          {secondaryText}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                        isSelected
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600",
                      )}
                    >
                      {isSelected
                        ? "선택됨"
                        : participantTypeLabels[participant.participantType]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantTypeSelect({
  defaultValue,
  disabled,
}: {
  defaultValue: ParticipantType;
  disabled: boolean;
}) {
  return (
    <select
      className={selectClass}
      defaultValue={defaultValue}
      disabled={disabled}
      name="participantType"
    >
      <option value="seller">셀러</option>
      <option value="staff">운영진</option>
      <option value="special_booth">특수 부스</option>
    </select>
  );
}
