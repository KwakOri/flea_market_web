"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useCreateUser } from "@/hooks/use-users";
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
import { invitableUserRoles } from "@/lib/user-role";
import type { UserRole } from "@/services/auth.service";

type FormMessage = {
  text: string;
  tone: "error" | "success";
};

export function DirectUserCreation({ enabled }: { enabled: boolean }) {
  const createUser = useCreateUser();
  const [message, setMessage] = useState<FormMessage | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = getFormString(formData, "email").trim();
    const displayName = getFormString(formData, "displayName").trim();
    const password = getFormString(formData, "password");
    const passwordConfirmation = getFormString(
      formData,
      "passwordConfirmation",
    );
    const role = getUserRole(formData.get("role"));

    if (!email || !displayName || !password || !passwordConfirmation) {
      setMessage({
        text: "이메일, 이름, 비밀번호를 모두 입력해주세요.",
        tone: "error",
      });
      return;
    }

    if (password.length < 8) {
      setMessage({
        text: "비밀번호는 8자 이상 입력해주세요.",
        tone: "error",
      });
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage({
        text: "비밀번호가 일치하지 않습니다.",
        tone: "error",
      });
      return;
    }

    try {
      await createUser.mutateAsync({
        displayName,
        email,
        password,
        role,
      });
      setMessage({
        text: "계정을 생성했습니다. 가입 사용자 목록에 반영했습니다.",
        tone: "success",
      });
      form.reset();
    } catch (error) {
      setMessage({ text: getErrorMessage(error), tone: "error" });
    }
  }

  return (
    <section className={panelVariants()}>
      <div className={sectionHeaderClass}>
        <p className={sectionTitleClass}>계정 직접 생성</p>
        <p className={sectionDescriptionClass}>
          이메일과 비밀번호를 지정해 바로 로그인할 수 있는 계정을 만듭니다.
          생성된 계정은 활성 상태로 등록됩니다.
        </p>
      </div>

      <form className="grid gap-4 p-5" onSubmit={handleCreate}>
        <fieldset
          className="grid gap-4 disabled:cursor-not-allowed"
          disabled={!enabled || createUser.isPending}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              이메일
              <input
                autoComplete="email"
                className={inputClass}
                name="email"
                placeholder="user@example.com"
                type="email"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              이름
              <input
                autoComplete="name"
                className={inputClass}
                name="displayName"
                placeholder="홍길동"
                type="text"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              비밀번호
              <input
                autoComplete="new-password"
                className={inputClass}
                name="password"
                placeholder="8자 이상"
                type="password"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              비밀번호 확인
              <input
                autoComplete="new-password"
                className={inputClass}
                name="passwordConfirmation"
                placeholder="비밀번호 재입력"
                type="password"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              역할
              <select
                aria-label="계정 역할"
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
            </label>
            <button
              className={`${buttonVariants()} sm:w-fit`}
              disabled={createUser.isPending}
              type="submit"
            >
              <UserPlus aria-hidden className="mr-2 h-4 w-4" />
              {createUser.isPending ? "생성 중" : "계정 생성"}
            </button>
          </div>
        </fieldset>

        {message && (
          <p
            className={`text-sm font-medium ${
              message.tone === "error" ? "text-error" : "text-brand"
            }`}
          >
            {message.text}
          </p>
        )}
      </form>
    </section>
  );
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getUserRole(value: FormDataEntryValue | null): UserRole {
  if (value === "admin") {
    return "admin";
  }

  return value === "seller" ? "seller" : "user";
}
