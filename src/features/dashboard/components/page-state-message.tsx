import {
  appShellClass,
  pageShellClass,
  panelVariants,
} from "@/lib/design-system";

export function PageStateMessage({ message }: { message: string }) {
  return (
    <main className={pageShellClass}>
      <div className={appShellClass}>
        <section className={panelVariants()}>
          <div className="px-4 py-12 text-center text-sm text-zinc-500">
            {message}
          </div>
        </section>
      </div>
    </main>
  );
}
