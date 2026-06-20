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
    <div className="mb-[22px] flex flex-wrap items-baseline gap-3.5">
      <h2 className="m-0 font-display text-[30px] font-bold tracking-[-0.025em] text-[#1a1b12]">
        {title}
      </h2>
      {subtitle ? (
        <span className="font-mono text-xs text-[#8a8775]">{subtitle}</span>
      ) : null}
      {eyebrow ? (
        <span className="font-mono text-[11px] text-[#a8a593]">{eyebrow}</span>
      ) : null}
    </div>
  );
}
