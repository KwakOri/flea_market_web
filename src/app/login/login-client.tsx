"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/services/api-client";
import {
  appShellClass,
  buttonVariants,
  inputClass,
  pageShellClass,
  panelVariants,
} from "@/lib/design-system";

export function LoginClient({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const login = useLogin();
  const [message, setMessage] = useState<string | null>(null);
  const safeNextPath = getSafeNextPath(nextPath);

  useEffect(() => {
    if (currentUser.data) {
      router.replace(safeNextPath);
    }
  }, [currentUser.data, router, safeNextPath]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = getFormString(formData, "email").trim();
    const password = getFormString(formData, "password");

    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      await login.mutateAsync({ email, password });
      router.replace(safeNextPath);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className={pageShellClass}>
      <div className={appShellClass}>
        <section className="mx-auto grid min-h-[70vh] w-full max-w-[440px] place-items-center">
          <div className={panelVariants()}>
            <div className="border-b border-hairline px-5 py-5">
              <p className="text-[13px] font-semibold text-brand">
                Flea Market Settlement
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">
                로그인
              </h1>
            </div>
            <form
              className="grid gap-3 p-5"
              data-testid="login-form"
              onSubmit={handleLoginSubmit}
            >
              <input
                autoComplete="email"
                autoFocus
                className={inputClass}
                name="email"
                placeholder="email@example.com"
                type="email"
              />
              <input
                autoComplete="current-password"
                className={inputClass}
                name="password"
                placeholder="비밀번호"
                type="password"
              />
              <button
                className={buttonVariants()}
                data-testid="login-submit"
                disabled={login.isPending || currentUser.isLoading}
                type="submit"
              >
                로그인
              </button>
              {message && (
                <p className="text-sm font-medium text-error">{message}</p>
              )}
              {currentUser.isLoading && (
                <p className="text-sm text-muted">
                  사용자 정보를 확인하는 중입니다.
                </p>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function getSafeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/management";
  }

  if (value === "/login" || value.startsWith("/login?")) {
    return "/management";
  }

  return value;
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
}
