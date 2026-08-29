"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { InvitationManagement } from "@/features/auth/components/invitation-management";
import { useUpdateUserRole, useUsers } from "@/hooks/use-users";
import {
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
  selectClass,
} from "@/lib/design-system";
import { getErrorMessage } from "@/lib/error-message";
import { editableUserRoles, userRoleLabels } from "@/lib/user-role";
import type { EditableUserRole } from "@/services/auth.service";
import type { UserStatus } from "@/services/users.service";

const userStatusLabels: Record<UserStatus, string> = {
  active: "활성",
  disabled: "사용 중지",
  pending_email_verification: "이메일 확인 대기",
};

export function UserManagementScreen({
  enabled,
  isAdmin,
}: {
  enabled: boolean;
  isAdmin: boolean;
}) {
  const users = useUsers(enabled && isAdmin);
  const updateRole = useUpdateUserRole();
  const [message, setMessage] = useState<string | null>(null);

  async function handleRoleChange(
    userId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setMessage(null);
    const role = getEditableUserRole(event.currentTarget.value);

    try {
      await updateRole.mutateAsync({ role, userId });
      setMessage(`역할을 ${userRoleLabels[role]}로 변경했습니다.`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  if (!isAdmin) {
    return (
      <section className={panelVariants({ padding: "md" })}>
        <p className="text-sm font-medium text-error">
          사용자 관리는 관리자만 이용할 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-5">
      <InvitationManagement enabled={enabled} />
      <section className={panelVariants()}>
        <div className={sectionHeaderClass}>
          <p className={sectionTitleClass}>가입 사용자</p>
          <p className={sectionDescriptionClass}>
            가입한 사용자를 확인하고 운영자와 셀러의 역할을 변경합니다. 관리자
            역할은 이 화면에서 변경할 수 없습니다.
          </p>
        </div>

        <div className="p-5">
          {message && (
            <p className="mb-3 text-sm font-medium text-brand">{message}</p>
          )}

          {users.isLoading ? (
            <p className="text-sm text-muted">사용자를 불러오는 중입니다.</p>
          ) : users.isError ? (
            <p className="text-sm font-medium text-error">
              사용자 목록을 불러오지 못했습니다.
            </p>
          ) : users.data?.length ? (
            <div className="grid gap-2">
              {users.data.map((user) => (
                <div
                  className="grid gap-3 rounded-[10px] border border-hairline px-4 py-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center"
                  key={user.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user.displayName}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {user.email} · {userStatusLabels[user.status]} · 최근
                      로그인 {formatOptionalDateTime(user.lastLoginAt)}
                    </p>
                  </div>

                  {user.role === "admin" ? (
                    <select
                      aria-label={`${user.displayName} 역할`}
                      className={selectClass}
                      disabled
                      value="admin"
                    >
                      <option value="admin">{userRoleLabels.admin}</option>
                    </select>
                  ) : (
                    <select
                      aria-label={`${user.displayName} 역할`}
                      className={selectClass}
                      disabled={updateRole.isPending}
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event)}
                    >
                      {editableUserRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">가입한 사용자가 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function getEditableUserRole(value: string): EditableUserRole {
  return value === "seller" ? "seller" : "user";
}

function formatOptionalDateTime(value: string | null): string {
  if (!value) {
    return "없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
