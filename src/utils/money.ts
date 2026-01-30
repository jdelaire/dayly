export const MAX_CENTS = 9_999_999;

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string) {
  const key = currency || "USD";
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: key,
  });
  formatterCache.set(key, formatter);
  return formatter;
}

export function formatCents(cents: number, currency = "USD") {
  return getFormatter(currency).format(cents / 100);
}

export function formatEditableCents(cents: number | undefined) {
  if (cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export function parseMoneyToCents(input: string, currency = "USD") {
  const normalized = input.trim().replace(/,/g, "");
  if (!normalized) return { cents: null } as const;

  const match = normalized.match(/^(\d+)(\.(\d{0,2}))?$/);
  if (!match) {
    return { error: "Enter a non-negative amount with up to 2 decimals." } as const;
  }

  const dollars = Number(match[1]);
  const centsPart = (match[3] || "").padEnd(2, "0");
  const cents = dollars * 100 + Number(centsPart || 0);

  if (!Number.isFinite(cents) || cents > MAX_CENTS) {
    return {
      error: `Value must be between 0 and ${formatCents(MAX_CENTS, currency)}.`,
    } as const;
  }

  return { cents } as const;
}

export function isValidCents(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_CENTS;
}
