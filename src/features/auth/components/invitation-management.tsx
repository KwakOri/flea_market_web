"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Copy, Link2, RotateCcw } from "lucide-react";
import {
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
} from "@/hooks/use-invitations";
import {
  buttonVariants,
  inputClass,
  panelVariants,
  selectClass,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";
import { getErrorMessage } from "@/lib/error-message";
import type {
  CreatedInvitation,
  InvitationStatus,
} from "@/services/invitations.service";
import type { InvitableUserRole } from "@/services/auth.service";
import { invitableUserRoles, userRoleLabels } from "@/lib/user-role";

const invitationStatusLabels: Record<InvitationStatus, string> = {
  pending: "대기",
  accepted: "가입 완료",
  expired: "만료",
  revoked: "폐기",
};

export function InvitationManagement({ enabled }: { enabled: boolean }) {
  const invitations = useInvitations(enabled);
  const createInvitation = useCreateInvitation();
  const revokeInvitation = useRevokeInvitation();
  const [createdInvitation, setCreatedInvitation] =
    useState<CreatedInvitation | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = getFormString(formData, "email").trim();
    const role = getInvitableUserRole(formData.get("role"));
    if (!email) {
      setMessage("초대할 이메일을 입력해주세요.");
      return;
    }

    try {
      const invitation = await createInvitation.mutateAsync({ email, role });
      setCreatedInvitation(invitation);
      setMessage(getDeliveryMessage(invitation.deliveryStatus));
      form.reset();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleCopy() {
    if (!createdInvitation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdInvitation.inviteUrl);
      setMessage("초대 링크를 복사했습니다.");
    } catch {
      setMessage("링크를 직접 선택해 복사해주세요.");
    }
  }

  async function handleRevoke(invitationId: string) {
    setMessage(null);

    try {
      await revokeInvitation.mutateAsync(invitationId);
      if (createdInvitation?.id === invitationId) {
        setCreatedInvitation(null);
      }
      setMessage("초대를 폐기했습니다.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <section className={panelVariants()}>
      <div className={sectionHeaderClass}>
        <p className={sectionTitleClass}>계정 초대</p>
        <p className={sectionDescriptionClass}>
          역할을 지정해 가입 링크를 발급합니다. 링크는 72시간 동안 한 번만
          사용할 수 있습니다.
        </p>
      </div>

      <form
        className="grid gap-3 border-b border-hairline p-5 sm:grid-cols-[minmax(0,1fr)_160px_auto]"
        onSubmit={handleCreate}
      >
        <input
          autoComplete="email"
          className={inputClass}
          name="email"
          placeholder="seller@example.com"
          type="email"
        />
        <select
          aria-label="초대 역할"
          className={selectClass}
          defaultValue="user"
          name="role"
        >
          {invitableUserRoles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <button
          className={buttonVariants()}
          disabled={createInvitation.isPending}
          type="submit"
        >
          <Link2 aria-hidden className="mr-2 h-4 w-4" />
          {createInvitation.isPending ? "발급 중" : "초대 링크 발급"}
        </button>
      </form>

      {createdInvitation && (
        <div className="grid gap-2 border-b border-hairline bg-brand-tint/40 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label
              className="mb-1 block text-xs font-semibold text-muted"
              htmlFor="created-invitation-url"
            >
              이번에 발급한 링크 · 이 화면에서 한 번만 확인 가능
            </label>
            <input
              className={inputClass}
              id="created-invitation-url"
              readOnly
              value={createdInvitation.inviteUrl}
            />
          </div>
          <button
            className={`${buttonVariants({ intent: "secondary" })} self-end`}
            onClick={handleCopy}
            type="button"
          >
            <Copy aria-hidden className="mr-2 h-4 w-4" />
            복사
          </button>
        </div>
      )}

      <div className="p-5">
        {message && (
          <p className="mb-3 text-sm font-medium text-brand">{message}</p>
        )}

        {invitations.isLoading ? (
          <p className="text-sm text-muted">초대 목록을 불러오는 중입니다.</p>
        ) : invitations.isError ? (
          <p className="text-sm font-medium text-error">
            초대 목록을 불러오지 못했습니다.
          </p>
        ) : invitations.data?.length ? (
          <div className="grid gap-2">
            {invitations.data.map((invitation) => (
              <div
                className="flex flex-col gap-3 rounded-[10px] border border-hairline px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                key={invitation.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {userRoleLabels[invitation.role]} ·{" "}
                    {invitationStatusLabels[invitation.status]} · 만료{" "}
                    {formatDateTime(invitation.expiresAt)}
                  </p>
                </div>
                {invitation.status === "pending" && (
                  <button
                    className={buttonVariants({ intent: "quiet", size: "sm" })}
                    disabled={revokeInvitation.isPending}
                    onClick={() => handleRevoke(invitation.id)}
                    type="button"
                  >
                    <RotateCcw aria-hidden className="mr-1.5 h-3.5 w-3.5" />
                    폐기
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">발급된 초대가 없습니다.</p>
        )}
      </div>
    </section>
  );
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getInvitableUserRole(
  value: FormDataEntryValue | null,
): InvitableUserRole {
  if (value === "admin") {
    return "admin";
  }

  return value === "seller" ? "seller" : "user";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDeliveryMessage(
  status: CreatedInvitation["deliveryStatus"],
): string {
  if (status === "sent") {
    return "초대 메일을 발송했습니다.";
  }

  if (status === "failed") {
    return "메일 발송에 실패했습니다. 아래 링크를 직접 전달해주세요.";
  }

  return "메일 발송이 설정되지 않았습니다. 아래 링크를 직접 전달해주세요.";
}
