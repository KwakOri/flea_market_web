export function parseMoneyInputAmount(value: string): number | null {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : null;
}

export function formatMoneyAmount(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatWon(value: number): string {
  return `${formatMoneyAmount(value)}원`;
}

export function formatMoneyInput(value: string): string {
  const amount = parseMoneyInputAmount(value);
  return amount === null ? "" : formatMoneyAmount(amount);
}
