import type { FormEvent } from "react";
import { Ban } from "lucide-react";
import type { Settlement } from "@/services/settlements.service";
import {
  buttonVariants,
  inputClass,
  panelVariants,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

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
    <section className={panelVariants()}>
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>회차 관리</h2>
      </div>
      <form
        className="grid gap-2 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={onSubmit}
      >
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          무효 사유
          <input
            className={inputClass}
            disabled={isSubmitting}
            maxLength={1000}
            placeholder={`v${settlement.versionNo} 무효 사유`}
            value={memo}
            onChange={(event) => onMemoChange(event.target.value)}
          />
        </label>
        <button
          className={cn(
            buttonVariants(),
            "self-end bg-red-700 hover:bg-red-800 focus-visible:ring-red-600",
          )}
          disabled={isSubmitting}
          type="submit"
        >
          <Ban aria-hidden className="mr-2 h-4 w-4" />
          {isSubmitting ? "처리 중" : "무효 처리"}
        </button>
        {message && (
          <p className="text-sm font-medium text-red-700 md:col-span-2">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
