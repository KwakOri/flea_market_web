export function DashboardPageTitle({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="mb-5 grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:items-baseline sm:gap-3.5">
      <h2 className="m-0 min-w-0 font-display text-[24px] font-bold leading-[1.25] tracking-[-0.01em] text-ink sm:text-[28px]">
        {title}
      </h2>
      {subtitle ? (
        <span className="min-w-0 font-mono text-xs leading-relaxed text-muted">
          {subtitle}
        </span>
      ) : null}
      {eyebrow ? (
        <span className="min-w-0 font-mono text-[11px] text-muted-soft">
          {eyebrow}
        </span>
      ) : null}
    </div>
  );
}
