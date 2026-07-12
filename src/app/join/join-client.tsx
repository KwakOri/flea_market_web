"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAcceptInvitation,
  useInvitationValidation,
} from "@/hooks/use-invitations";
import {
  appShellClass,
  buttonVariants,
  inputClass,
  pageShellClass,
  panelVariants,
} from "@/lib/design-system";
import { getErrorMessage } from "@/lib/error-message";

export function JoinClient({ token }: { token: string }) {
  const router = useRouter();
  const invitation = useInvitationValidation(token);
  const acceptInvitation = useAcceptInvitation();
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const displayName = getFormString(formData, "displayName").trim();
    const password = getFormString(formData, "password");
    const passwordConfirmation = getFormString(
      formData,
      "passwordConfirmation",
    );

    if (!displayName || !password) {
      setMessage("이름과 비밀번호를 입력해주세요.");
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      await acceptInvitation.mutateAsync({ displayName, password, token });
      router.replace("/management");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  const invalidToken = token.length < 32 || invitation.isError;

  return (
    <main className={pageShellClass}>
      <div className={appShellClass}>
        <section className="mx-auto grid min-h-[70vh] w-full max-w-[460px] place-items-center">
          <div className={panelVariants()}>
            <div className="border-b border-hairline px-5 py-5">
              <p className="text-[13px] font-semibold text-brand">
                Flea Market Settlement
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">
                초대받은 계정 만들기
              </h1>
              {invitation.data && (
                <p className="mt-2 text-sm text-muted">
                  가입 이메일: {invitation.data.emailHint}
                </p>
              )}
            </div>

            {invitation.isLoading ? (
              <p className="p-5 text-sm text-muted">
                초대 링크를 확인하는 중입니다.
              </p>
            ) : invalidToken ? (
              <div className="grid gap-4 p-5">
                <p className="text-sm font-medium text-error">
                  유효하지 않거나 만료된 초대 링크입니다.
                </p>
                <Link
                  className={buttonVariants({ intent: "secondary" })}
                  href="/login"
                >
                  로그인으로 이동
                </Link>
              </div>
            ) : (
              <form className="grid gap-3 p-5" onSubmit={handleSubmit}>
                <input
                  autoComplete="name"
                  autoFocus
                  className={inputClass}
                  name="displayName"
                  placeholder="이름"
                  type="text"
                />
                <input
                  autoComplete="new-password"
                  className={inputClass}
                  minLength={8}
                  name="password"
                  placeholder="비밀번호 · 8자 이상"
                  type="password"
                />
                <input
                  autoComplete="new-password"
                  className={inputClass}
                  minLength={8}
                  name="passwordConfirmation"
                  placeholder="비밀번호 확인"
                  type="password"
                />
                <button
                  className={buttonVariants()}
                  disabled={acceptInvitation.isPending}
                  type="submit"
                >
                  {acceptInvitation.isPending ? "계정 생성 중" : "가입 완료"}
                </button>
                {message && (
                  <p className="text-sm font-medium text-error">{message}</p>
                )}
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
