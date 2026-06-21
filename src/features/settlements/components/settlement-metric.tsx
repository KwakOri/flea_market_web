import { cn } from "@/lib/utils";

export function SettlementMetric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "dark" | "default" | "green";
  value: string;
}) {
  const toneClass = {
    amber: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#a9791f]",
    },
    blue: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#2d6fe0]",
    },
    dark: {
      card: "border-[#16170f] bg-[#16170f]",
      label: "text-[#9b9a86]",
      value: "text-white",
    },
    default: {
      card: "border-[#e6e2d4] bg-white",
      label: "text-[#8a8775]",
      value: "text-[#1a1b12]",
    },
    green: {
      card: "border-[#bfe3cd] bg-[#e6f4ec]",
      label: "text-[#1f8a4d]",
      value: "text-[#1f8a4d]",
    },
  }[tone];

  return (
    <div
      className={cn(
        "min-w-0 rounded-[16px] border p-4 sm:p-[18px]",
        toneClass.card,
      )}
    >
      <dt
        className={cn(
          "font-mono text-[10.5px] tracking-[0.05em]",
          toneClass.label,
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 truncate font-display text-[20px] font-bold leading-tight sm:text-[23px]",
          toneClass.value,
        )}
      >
        {value}
      </dd>
    </div>
  );
}
