"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useApiReadiness } from "@/hooks/use-api-readiness";
import { buttonVariants } from "@/lib/design-system";

export function ApiReadinessOverlay() {
  const readiness = useApiReadiness();
  const isWaking = readiness === "waking";
  const isUnavailable = readiness === "unavailable";

  if (!isWaking && !isUnavailable) {
    return null;
  }

  return (
    <div
      aria-describedby="api-readiness-description"
      aria-labelledby="api-readiness-title"
      aria-live={isUnavailable ? "assertive" : "polite"}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-scrim/60 p-4 backdrop-blur-[2px]"
      role="dialog"
    >
      <section className="w-full max-w-sm rounded-[16px] border border-hairline bg-surface-raised p-6 text-center shadow-modal">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand">
          {isUnavailable ? (
            <RefreshCw aria-hidden className="h-6 w-6" />
          ) : (
            <LoaderCircle aria-hidden className="h-6 w-6 animate-spin" />
          )}
        </div>
        <h2
          className="mt-4 text-base font-semibold text-ink"
          id="api-readiness-title"
        >
          {isUnavailable
            ? "서비스에 연결할 수 없습니다"
            : "서비스를 준비하는 중입니다"}
        </h2>
        <p
          className="mt-2 text-sm leading-relaxed text-muted"
          id="api-readiness-description"
        >
          {isUnavailable
            ? "잠시 후 다시 시도해주세요."
            : "첫 접속은 최대 1분 정도 걸릴 수 있습니다. 잠시만 기다려주세요."}
        </p>
        {isUnavailable && (
          <button
            className={`${buttonVariants({ size: "sm" })} mt-5 w-full`}
            onClick={() => window.location.reload()}
            type="button"
          >
            다시 시도
          </button>
        )}
      </section>
    </div>
  );
}
