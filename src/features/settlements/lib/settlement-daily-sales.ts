import type { Receipt } from "@/services/receipts.service";
import {
  getDateOnlyKey,
  parseDateOnly,
} from "@/features/receipts/lib/receipt-date-time";

export type ParticipantDailySalesPoint = {
  date: string;
  amount: number;
  saleCount: number;
};

export function buildParticipantDailySales(
  participantId: string,
  receipts: Receipt[],
  startsOn: string | null,
  endsOn: string | null,
): ParticipantDailySalesPoint[] {
  const salesByDate = new Map<string, ParticipantDailySalesPoint>();

  for (const receipt of receipts) {
    const date = getLocalDateKey(receipt.soldAt);

    for (const saleLine of receipt.saleLines) {
      if (saleLine.participantId !== participantId) {
        continue;
      }

      const point = salesByDate.get(date) ?? {
        date,
        amount: 0,
        saleCount: 0,
      };

      point.amount += saleLine.netAmount;
      point.saleCount += 1;
      salesByDate.set(date, point);
    }
  }

  const dateRange = buildDateRange(
    startsOn ?? getFirstSalesDate(salesByDate),
    endsOn ?? getLastSalesDate(salesByDate),
  );

  if (dateRange.length === 0) {
    return [...salesByDate.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  return dateRange.map(
    (date) =>
      salesByDate.get(date) ?? {
        date,
        amount: 0,
        saleCount: 0,
      },
  );
}

function buildDateRange(startsOn: string | null, endsOn: string | null): string[] {
  if (!startsOn && !endsOn) {
    return [];
  }

  const startDate = parseDateOnly(startsOn ?? endsOn ?? "");
  const endDate = parseDateOnly(endsOn ?? startsOn ?? "");

  if (!startDate || !endDate) {
    return [];
  }

  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate.getTime() <= endDate.getTime()) {
    dates.push(getDateOnlyKey(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function getLocalDateKey(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return getDateOnlyKey(date);
}

function getFirstSalesDate(
  salesByDate: Map<string, ParticipantDailySalesPoint>,
): string | null {
  return [...salesByDate.keys()].sort()[0] ?? null;
}

function getLastSalesDate(
  salesByDate: Map<string, ParticipantDailySalesPoint>,
): string | null {
  return [...salesByDate.keys()].sort().at(-1) ?? null;
}
