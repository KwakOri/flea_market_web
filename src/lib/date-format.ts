export function formatDateRange(
  startsOn: string | null,
  endsOn: string | null,
): string {
  if (!startsOn && !endsOn) {
    return "-";
  }

  if (startsOn && endsOn) {
    return `${startsOn} - ${endsOn}`;
  }

  return startsOn ?? endsOn ?? "-";
}

export function formatMarketDuration(
  startsOn: string | null,
  endsOn: string | null,
): string {
  if (!startsOn && !endsOn) {
    return "-";
  }

  if (!startsOn || !endsOn) {
    return "1일";
  }

  const startTime = new Date(`${startsOn}T00:00:00`).getTime();
  const endTime = new Date(`${endsOn}T00:00:00`).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return "-";
  }

  const days = Math.max(
    1,
    Math.floor((endTime - startTime) / 86_400_000) + 1,
  );

  return `${days}일`;
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
