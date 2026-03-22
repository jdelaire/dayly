<template>
  <div v-if="loadError" class="blocking-error">
    <div class="blocking-card">
      <h2>Data problem</h2>
      <p>{{ loadError }}</p>
      <button class="primary" @click="resetData">Reset data</button>
    </div>
  </div>

  <main class="app">
    <header class="header">
      <div>
        <div class="brand">
          <img src="/logo_full.svg" alt="Dayly" class="brand-logo" />
          <h1 class="sr-only">Dayly</h1>
        </div>
        <p class="eyebrow">Daily spend tracker</p>
        <p class="subtitle">Track one number per day. Keep the month honest.</p>
      </div>
      <div class="actions">
        <button class="ghost" @click="onExport">Export JSON</button>
        <button class="primary" @click="openImport">Import JSON</button>
      </div>
    </header>

    <section class="panel">
      <div class="panel-row">
        <div class="field-inline">
          <label for="monthInput">Month</label>
          <select id="monthInput" v-model="selectedMonth">
            <option v-for="month in monthOptions" :key="month" :value="month">
              {{ formatMonthLabel(month) }}
            </option>
          </select>
        </div>
        <div class="field-inline">
          <label for="currencySelect">Currency</label>
          <select id="currencySelect" v-model="currency" @change="setCurrency(currency)">
            <option v-for="code in currencyOptions" :key="code" :value="code">{{ code }}</option>
          </select>
        </div>
      </div>
      <div class="stats">
        <div class="stat">
          <p>Total</p>
          <strong>{{ formatCents(monthStats.totalCents, currency) }}</strong>
          <span class="muted">{{ monthStats.daysInMonth }} days</span>
        </div>
        <div class="stat">
          <p>Average / day</p>
          <strong>{{ formatCents(monthStats.averageCents, currency) }}</strong>
          <span class="muted">Total / {{ monthStats.daysInMonth }}</span>
        </div>
        <div class="stat">
          <p>Average / month</p>
          <strong>{{ formatCents(averagePerMonthStats.averageCents, currency) }}</strong>
          <span class="muted">
            {{
              averagePerMonthStats.monthsCount
                ? `${averagePerMonthStats.monthsCount} recorded month${averagePerMonthStats.monthsCount === 1 ? "" : "s"}`
                : "No recorded months yet"
            }}
          </span>
        </div>
        <div v-if="soFarStats" class="stat">
          <p>So far total</p>
          <strong>{{ formatCents(soFarStats.totalCents, currency) }}</strong>
          <span class="muted">Days 1-{{ soFarStats.daysCount }}</span>
        </div>
        <div v-if="soFarStats" class="stat">
          <p>So far avg / day</p>
          <strong>{{ formatCents(soFarStats.averageCents, currency) }}</strong>
          <span class="muted">Total / {{ soFarStats.daysCount }}</span>
        </div>
      </div>
    </section>

    <section class="panel panel-chart">
      <SpendChart :months="monthOptions" :values="dayValues" :currency="currency" />
    </section>

    <section class="panel">
      <div class="panel-row">
        <h2>Days</h2>
        <p class="muted">Click a value to edit, Enter to save.</p>
      </div>
      <ul class="days">
        <DayRow
          v-for="day in monthDays"
          :key="day.key"
          :day="day"
          :value-cents="dayValues[day.key]"
          :currency="currency"
          @save="onSaveDay"
        />
      </ul>
    </section>
  </main>

  <ImportDialog ref="importDialog" @apply="onApplyImport" />

  <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import DayRow from "./components/DayRow.vue";
import ImportDialog from "./components/ImportDialog.vue";
import SpendChart from "./components/SpendChart.vue";
import { useDaylyStore } from "./composables/useDaylyStore";
import { useMonthDays } from "./composables/useMonthDays";
import { useFileIO } from "./composables/useFileIO";
import type { DaylyData } from "./utils/data";
import { formatMonthLabel } from "./utils/date";
import { formatCents } from "./utils/money";

const {
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
} = useDaylyStore();

const monthDays = useMonthDays(selectedMonth);
const dayValues = computed(() => data.value.days);
const importDialog = ref<InstanceType<typeof ImportDialog> | null>(null);
const { exportData } = useFileIO();
const currencyOptions = ["USD", "EUR", "THB"];

const toastMessage = ref("");
const toastVisible = ref(false);
let toastTimer: number | undefined;

function onSaveDay(payload: { key: string; cents: number | null }) {
  updateDay(payload.key, payload.cents);
}

function openImport() {
  importDialog.value?.open();
}

function onApplyImport(payload: { mode: "merge" | "replace"; data: DaylyData }) {
  if (payload.mode === "replace") {
    replaceAll(payload.data);
    showToast("Data replaced.");
  } else {
    mergeAll(payload.data);
    showToast("Data merged.");
  }
}

function onExport() {
  exportData(data.value);
  showToast("Exported JSON.");
}

function showToast(message: string) {
  toastMessage.value = message;
  toastVisible.value = true;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false;
  }, 2400);
}
</script>
