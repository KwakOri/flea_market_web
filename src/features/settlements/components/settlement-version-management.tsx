import type { FormEvent } from "react";
import { Ban } from "lucide-react";
import type { Settlement } from "@/services/settlements.service";

export function SettlementManagement({
  isSubmitting,
  memo,
  message,
  settlement,
  onMemoChange,
  onSubmit,
}: {
  isSubmitting: boolean;
  memo: string;
  message: string | null;
  settlement: Settlement;
  onMemoChange: (memo: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-[12px] border border-hairline bg-surface px-5 py-[22px] shadow-card sm:px-6">
      <h2 className="dsp m-0 text-[17px] font-bold text-ink">
        회차 관리
      </h2>
      <form className="mt-3.5 grid gap-3" onSubmit={onSubmit}>
        <label className="mono text-[10.5px] tracking-[0.05em] text-muted">
          무효 사유
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            className="min-h-11 min-w-0 flex-1 rounded-[8px] border border-border bg-surface px-[15px] py-[13px] text-[14px] font-medium text-ink outline-none transition placeholder:text-muted-soft focus:border-ink focus:ring-2 focus:ring-brand-tint disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            maxLength={1000}
            placeholder={`v${settlement.versionNo} 무효 사유`}
            value={memo}
            onChange={(event) => onMemoChange(event.target.value)}
          />
          <button
            className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-[8px] bg-[#16170f] px-5 text-[14px] font-bold text-[#ff7a6b] transition hover:bg-[#2a2b20] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            <Ban aria-hidden className="h-4 w-4" />
            {isSubmitting ? "처리 중" : "무효 처리"}
          </button>
        </div>
        {message && (
          <p className="text-sm font-semibold text-error">{message}</p>
        )}
      </form>
    </section>
  );
}
