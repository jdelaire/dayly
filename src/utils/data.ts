import type { DayKey } from "./date";
import { isValidDayKey } from "./date";
import { isValidCents } from "./money";

export type SchemaVersion = 1;
export interface DaylyData {
  schemaVersion: SchemaVersion;
  days: Record<DayKey, number>;
}

export const SCHEMA_VERSION: SchemaVersion = 1;

export function cloneData(data: DaylyData): DaylyData {
  return {
    schemaVersion: data.schemaVersion,
    days: { ...data.days },
  };
}

export function mergeData(local: DaylyData, incoming: DaylyData): DaylyData {
  const merged = cloneData(local);
  for (const [key, value] of Object.entries(incoming.days)) {
    merged.days[key as DayKey] = value;
  }
  return merged;
}

export function validateData(data: unknown): asserts data is DaylyData {
  if (!data || typeof data !== "object") {
    throw new Error("Data is not an object.");
  }

  const parsed = data as DaylyData;
  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("Schema version mismatch. Please reset data.");
  }

  if (!parsed.days || typeof parsed.days !== "object") {
    throw new Error("Data is missing days.");
  }

  for (const [key, value] of Object.entries(parsed.days)) {
    if (!isValidDayKey(key)) {
      throw new Error(`Invalid day key: ${key}`);
    }
    if (!isValidCents(value as number)) {
      throw new Error(`Invalid value for ${key}`);
    }
  }
}
