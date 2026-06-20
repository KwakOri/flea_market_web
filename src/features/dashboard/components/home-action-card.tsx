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
      className="group flex min-h-[180px] flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      href={href}
    >
      <div>
        <p className="text-xs font-semibold text-emerald-700">업무 선택</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-950">{label}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <span className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-800 transition group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
        열기
      </span>
    </Link>
  );
}
