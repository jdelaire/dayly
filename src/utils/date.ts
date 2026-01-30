export type DayKey = string;
export type MonthKey = string;

export const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
export const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

export function toMonthKey(date: Date): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey: MonthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

export function buildMonthDays(monthKey: MonthKey) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const days: { date: Date; key: DayKey }[] = [];

  for (let day = 1; day <= count; day += 1) {
    const date = new Date(year, monthIndex, day);
    days.push({ date, key: toDayKey(date) });
  }

  return days;
}

export function isValidDayKey(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function monthKeyFromDayKey(dayKey: DayKey): MonthKey {
  return dayKey.slice(0, 7);
}

export function formatMonthLabel(monthKey: MonthKey) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  return monthLabelFormatter.format(new Date(year, monthIndex, 1));
}
