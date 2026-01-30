import { computed, type Ref } from "vue";
import type { MonthKey } from "../utils/date";
import { buildMonthDays } from "../utils/date";

export function useMonthDays(monthKey: Ref<MonthKey>) {
  return computed(() => buildMonthDays(monthKey.value));
}
