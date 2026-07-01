import { CheckCircle2, X } from "lucide-react";

export type ToastState = {
  id: number;
  message: string;
  title: string;
};

export function DashboardToast({
  onDismiss,
  toast,
}: {
  onDismiss: () => void;
  toast: ToastState | null;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm"
      role="status"
    >
      <div className="flex items-start gap-3 rounded-md border border-brand bg-brand-deep px-4 py-3 text-on-brand-deep shadow-lg">
        <CheckCircle2
          aria-hidden
          className="mt-0.5 h-5 w-5 flex-none text-brand-spring"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm text-on-brand-deep">{toast.message}</p>
        </div>
        <button
          aria-label="토스트 닫기"
          className="rounded p-1 text-on-brand-deep transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-spring"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
