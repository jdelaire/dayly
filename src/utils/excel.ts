import * as XLSX from "xlsx";
import { SCHEMA_VERSION, type DaylyData } from "./data";
import { isValidDayKey, toDayKey } from "./date";
import { MAX_CENTS } from "./money";

const MONTH_SHEET_PATTERN = /^[A-Z]{2,4}\d{2}$/;

export function daylyDataFromWorkbook(workbook: XLSX.WorkBook): DaylyData {
  const monthSheets = workbook.SheetNames.filter(
    (name, index) => index >= 3 && MONTH_SHEET_PATTERN.test(name)
  );

  if (monthSheets.length === 0) {
    throw new Error("No month sheets found after the first three tabs.");
  }

  const days: Record<string, number> = {};

  for (const sheetName of monthSheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
    }) as unknown[][];

    for (const row of rows) {
      const dayKey = parseDayKey(row?.[1]);
      if (!dayKey) continue;
      const cents = parseCents(row?.[2]);
      if (cents === null) continue;
      days[dayKey] = cents;
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    days,
  };
}

function parseDayKey(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return toDayKey(value);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(parsed.y, parsed.m - 1, parsed.d);
    return toDayKey(date);
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    const key = toDayKey(date);
    return isValidDayKey(key) ? key : null;
  }

  return null;
}

function parseCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  let numeric: number;
  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    if (!Number.isFinite(parsed)) return null;
    numeric = parsed;
  } else {
    return null;
  }

  if (!Number.isFinite(numeric) || numeric < 0) return null;
  const cents = Math.round(numeric * 100);
  if (cents > MAX_CENTS) {
    throw new Error(`Value ${numeric} exceeds max allowed.`);
  }
  return cents;
}
