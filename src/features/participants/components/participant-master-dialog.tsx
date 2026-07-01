"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { ParticipantMasterDialogMode } from "@/stores/dashboard-dialog.store";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 p-4">
      <section
        aria-labelledby="participant-master-dialog-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[16px] bg-surface-raised shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-3">
          <div>
            <h2
              className="text-base font-semibold text-ink"
              id="participant-master-dialog-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
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
            <label className="grid gap-1 text-xs font-medium text-body">
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
            <label className="grid gap-1 text-xs font-medium text-body">
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
            <label className="grid gap-1 text-xs font-medium text-body">
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
            <label className="grid gap-1 text-xs font-medium text-body">
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
            <label className="grid gap-1 text-xs font-medium text-body sm:col-span-2">
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
            <label className="grid gap-1 text-xs font-medium text-body">
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
          <label className="grid gap-1 text-xs font-medium text-body">
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
            <p className="text-xs text-muted">
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
            <p className="text-sm font-medium text-error">{message}</p>
          )}
        </form>
      </section>
    </div>
  );
}
