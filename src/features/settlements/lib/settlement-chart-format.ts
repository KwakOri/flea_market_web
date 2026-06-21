import { formatMoneyAmount } from "@/lib/money";

export function formatChartDateLabel(value: string): string {
  const [, month, day] = value.split("-");

  return month && day ? `${Number(month)}/${Number(day)}` : value;
}

export function formatCompactWon(value: number): string {
  if (value >= 100_000_000) {
    return `${formatCompactNumber(value / 100_000_000)}억`;
  }

  if (value >= 10_000) {
    return `${formatCompactNumber(value / 10_000)}만`;
  }

  return `${formatMoneyAmount(value)}원`;
}

export function truncateChartLabel(value: string): string {
  return value.length > 7 ? `${value.slice(0, 7)}...` : value;
}

function formatCompactNumber(value: number): string {
  return value >= 10
    ? String(Math.round(value))
    : value.toFixed(1).replace(/\.0$/, "");
}
