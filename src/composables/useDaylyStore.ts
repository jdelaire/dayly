import { computed, ref, watch } from "vue";
import type { DaylyData } from "../utils/data";
import { SCHEMA_VERSION, cloneData, mergeData, validateData } from "../utils/data";
import {
  buildMonthDays,
  monthKeyFromDayKey,
  parseMonthKey,
  toDayKey,
  toMonthKey,
} from "../utils/date";

const STORAGE_KEY = "dayly:v1";
const CURRENCY_KEY = "dayly:currency";

const data = ref<DaylyData>({ schemaVersion: SCHEMA_VERSION, days: {} });
const selectedMonth = ref(toMonthKey(new Date()));
const loadError = ref<string | null>(null);
const currency = ref(loadCurrency());

try {
  data.value = loadData();
} catch (error) {
  loadError.value = error instanceof Error ? error.message : "Could not load data.";
}

const monthStats = computed(() => computeMonthStats(data.value, selectedMonth.value));
const soFarStats = computed(() => computeSoFarStats(data.value, selectedMonth.value));
const averagePerMonthStats = computed(() => computeAveragePerMonthStats(data.value));
const monthOptions = computed(() => deriveMonthOptions(data.value));

watch(
  monthOptions,
  (options) => {
    if (!options.includes(selectedMonth.value)) {
      selectedMonth.value = options[options.length - 1];
    }
  },
  { immediate: true }
);

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { schemaVersion: SCHEMA_VERSION, days: {} };
  const parsed = JSON.parse(raw);
  validateData(parsed);
  return parsed;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value));
}

function loadCurrency() {
  const stored = localStorage.getItem(CURRENCY_KEY);
  return stored || "USD";
}

function setCurrency(next: string) {
  currency.value = next;
  localStorage.setItem(CURRENCY_KEY, next);
}

function updateDay(dayKey: string, cents: number | null) {
  const nextDays = { ...data.value.days };
  if (cents === null) {
    delete nextDays[dayKey];
  } else {
    nextDays[dayKey] = cents;
  }
  data.value = {
    ...data.value,
    days: nextDays,
  };
  saveData();
}

function replaceAll(newData: DaylyData) {
  data.value = cloneData(newData);
  saveData();
}

function mergeAll(newData: DaylyData) {
  data.value = mergeData(data.value, newData);
  saveData();
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CURRENCY_KEY);
  location.reload();
}

function computeMonthStats(dataset: DaylyData, monthKey: string) {
  const days = buildMonthDays(monthKey);
  let totalCents = 0;
  days.forEach((day) => {
    totalCents += dataset.days[day.key] ?? 0;
  });
  const daysInMonth = days.length;
  return {
    totalCents,
    averageCents: daysInMonth ? totalCents / daysInMonth : 0,
    daysInMonth,
  };
}

function computeSoFarStats(dataset: DaylyData, monthKey: string) {
  const today = new Date();
  const currentMonth = toMonthKey(today);
  if (monthKey !== currentMonth) return null;

  const { year, monthIndex } = parseMonthKey(monthKey);

  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const dayLimit = Math.min(today.getDate(), totalDays);
  let totalCents = 0;

  for (let day = 1; day <= dayLimit; day += 1) {
    const date = new Date(year, monthIndex, day);
    totalCents += dataset.days[toDayKey(date)] ?? 0;
  }

  return {
    totalCents,
    averageCents: dayLimit ? totalCents / dayLimit : 0,
    daysCount: dayLimit,
  };
}

function computeAveragePerMonthStats(dataset: DaylyData) {
  const totalsByMonth = new Map<string, number>();

  for (const [dayKey, cents] of Object.entries(dataset.days)) {
    const monthKey = monthKeyFromDayKey(dayKey);
    totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) ?? 0) + cents);
  }

  const monthsCount = totalsByMonth.size;
  const totalCents = Array.from(totalsByMonth.values()).reduce((sum, value) => sum + value, 0);

  return {
    averageCents: monthsCount ? totalCents / monthsCount : 0,
    monthsCount,
  };
}

export function useDaylyStore() {
  return {
    data,
    selectedMonth,
    loadError,
    currency,
    monthStats,
    soFarStats,
    averagePerMonthStats,
    monthOptions,
    updateDay,
    replaceAll,
    mergeAll,
    setCurrency,
    resetData,
  };
}

function deriveMonthOptions(dataset: DaylyData) {
  const months = new Set<string>();
  for (const key of Object.keys(dataset.days)) {
    months.add(monthKeyFromDayKey(key));
  }
  // Always include the current month so a new month shows up even with no entries yet.
  months.add(toMonthKey(new Date()));
  const sorted = Array.from(months).sort();
  return sorted;
}
