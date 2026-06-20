import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { Market } from "@/services/markets.service";
import type { MarketDialogMode } from "@/stores/dashboard-dialog.store";
import { marketStatusLabels } from "@/features/markets/lib/market-display";
import { buttonVariants, inputClass, selectClass } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function MarketDialog({
  editingMarket,
  isSubmitting,
  message,
  mode,
  onClose,
  onCreateSubmit,
  onUpdateSubmit,
}: {
  editingMarket: Market | null;
  isSubmitting: boolean;
  message: string | null;
  mode: MarketDialogMode;
  onClose: () => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditMode = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
      <div
        aria-modal="true"
        className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              {isEditMode ? "플리마켓 관리" : "플리마켓 추가"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isEditMode
                ? "플리마켓의 기본 정보와 진행 상태를 수정합니다."
                : "새로운 플리마켓 이벤트를 등록합니다."}
            </p>
          </div>
          <button
            aria-label="닫기"
            className={buttonVariants({ intent: "quiet", size: "sm" })}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
        {message && (
          <p className="border-b border-zinc-200 px-5 py-3 text-sm font-medium text-red-700">
            {message}
          </p>
        )}
        <form
          className="grid max-h-[calc(100vh-12rem)] gap-4 overflow-y-auto p-5"
          data-testid="market-form"
          onSubmit={isEditMode ? onUpdateSubmit : onCreateSubmit}
        >
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            마켓명
            <input
              className={inputClass}
              defaultValue={editingMarket?.name ?? ""}
              name="name"
              placeholder="마켓명"
              type="text"
            />
          </label>
          {isEditMode && (
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              상태
              <select
                className={selectClass}
                defaultValue={editingMarket?.status ?? "draft"}
                name="status"
              >
                {Object.entries(marketStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              시작일
              <input
                className={inputClass}
                defaultValue={editingMarket?.startsOn ?? ""}
                name="startsOn"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              종료일
              <input
                className={inputClass}
                defaultValue={editingMarket?.endsOn ?? ""}
                name="endsOn"
                type="date"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            메모
            <textarea
              className={cn(inputClass, "h-auto min-h-28 py-3")}
              defaultValue={editingMarket?.description ?? ""}
              name="description"
              placeholder="메모"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              className={buttonVariants({ intent: "secondary" })}
              onClick={onClose}
              type="button"
            >
              취소
            </button>
            <button
              className={buttonVariants()}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "저장 중" : isEditMode ? "저장" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
