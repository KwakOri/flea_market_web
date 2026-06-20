export function getDefaultReceiptDateTimeInputValue(
  startsOn: string | null,
  endsOn: string | null,
): string {
  const now = new Date();

  if (isDateTimeWithinReceiptPeriod(now, startsOn, endsOn)) {
    return formatDateTimeInputValue(now);
  }

  const endDate = parseDateOnly(endsOn ?? "");
  if (endDate) {
    endDate.setHours(23, 59, 0, 0);
    return formatDateTimeInputValue(endDate);
  }

  const startDate = parseDateOnly(startsOn ?? "");
  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
    return formatDateTimeInputValue(startDate);
  }

  return formatDateTimeInputValue(now);
}

export function buildReceiptSoldAtFromDateTimeInput(
  value: string,
  startsOn: string | null,
  endsOn: string | null,
): string {
  const date = parseLocalDateTimeInput(value);

  if (!date) {
    throw new Error("구매 날짜와 시간을 입력해주세요.");
  }

  if (!isDateTimeWithinReceiptPeriod(date, startsOn, endsOn)) {
    throw new Error("구매 날짜와 시간은 플리마켓 기간 내로 설정해주세요.");
  }

  return date.toISOString();
}

export function getReceiptDateTimeMin(startsOn: string | null): string | undefined {
  return startsOn ? `${startsOn}T00:00` : undefined;
}

export function getReceiptDateTimeMax(endsOn: string | null): string | undefined {
  return endsOn ? `${endsOn}T23:59` : undefined;
}

export function parseDateOnly(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function getDateOnlyKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isDateTimeWithinReceiptPeriod(
  date: Date,
  startsOn: string | null,
  endsOn: string | null,
): boolean {
  const startDate = parseDateOnly(startsOn ?? "");
  const endDate = parseDateOnly(endsOn ?? "");

  if (startDate && date.getTime() < startDate.getTime()) {
    return false;
  }

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    if (date.getTime() > endDate.getTime()) {
      return false;
    }
  }

  return true;
}

function parseLocalDateTimeInput(value: string): Date | null {
  const [datePart, timePart] = value.split("T");
  const date = parseDateOnly(datePart ?? "");

  if (!date || !timePart) {
    return null;
  }

  const [hours, minutes] = timePart.split(":").map(Number);

  if (
    hours === undefined ||
    minutes === undefined ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDateTimeInputValue(date: Date): string {
  return `${getDateOnlyKey(date)}T${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
}
