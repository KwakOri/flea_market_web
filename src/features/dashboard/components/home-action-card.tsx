import Link from "next/link";

export function HomeActionCard({
  description,
  href,
  label,
}: {
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="group flex min-h-[180px] flex-col justify-between rounded-lg border border-hairline bg-surface p-5 shadow-sm transition hover:border-brand hover:bg-brand-tint/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      href={href}
    >
      <div>
        <p className="text-xs font-semibold text-brand">업무 선택</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">{label}</h2>
        <p className="mt-3 text-sm leading-6 text-body">{description}</p>
      </div>
      <span className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-ink transition group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
        열기
      </span>
    </Link>
  );
}
