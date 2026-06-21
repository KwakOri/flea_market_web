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
      <h2 className="m-0 min-w-0 font-display text-[26px] font-bold leading-tight text-[#1a1b12] sm:text-[30px]">
        {title}
      </h2>
      {subtitle ? (
        <span className="min-w-0 font-mono text-xs leading-relaxed text-[#8a8775]">
          {subtitle}
        </span>
      ) : null}
      {eyebrow ? (
        <span className="min-w-0 font-mono text-[11px] text-[#a8a593]">
          {eyebrow}
        </span>
      ) : null}
    </div>
  );
}
