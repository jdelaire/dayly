<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <p class="eyebrow">Month over month</p>
        <h2>Spending comparison</h2>
      </div>
      <div class="chart-legend">
        <span class="legend-bar"></span>
        <span>Monthly total</span>
      </div>
    </div>

    <div class="chart-body">
      <svg :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Monthly spending comparison">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2a69b8" />
            <stop offset="100%" stop-color="#6fa2e6" />
          </linearGradient>
        </defs>
        <g class="grid">
          <line
            v-for="line in gridLines"
            :key="line"
            :x1="padding"
            :x2="width - padding"
            :y1="line"
            :y2="line"
          />
        </g>

        <g class="bars">
          <rect
            v-for="bar in bars"
            :key="bar.key"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            rx="10"
          >
            <title>{{ bar.label }}</title>
          </rect>
        </g>

        <g class="labels">
          <text
            v-for="label in labels"
            :key="label.key"
            :x="label.x"
            :y="label.y"
            text-anchor="middle"
          >
            {{ label.text }}
          </text>
        </g>
      </svg>
    </div>

    <div class="chart-footer">
      <div>
        <p class="muted">Highest month</p>
        <strong>{{ maxLabel }}</strong>
      </div>
      <div>
        <p class="muted">Lowest month</p>
        <strong>{{ minLabel }}</strong>
      </div>
      <div>
        <p class="muted">Latest vs previous</p>
        <strong>{{ trendLabel }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatCents } from "../utils/money";
import { formatMonthLabel } from "../utils/date";

const props = defineProps<{
  months: string[];
  values: Record<string, number>;
  currency: string;
}>();

const width = 720;
const height = 260;
const padding = 32;
const labelHeight = 32;

const monthTotals = computed(() => {
  const grouped: Record<string, number> = {};
  for (const [key, value] of Object.entries(props.values)) {
    const monthKey = key.slice(0, 7);
    grouped[monthKey] = (grouped[monthKey] ?? 0) + value;
  }

  return props.months.map((month) => ({
    key: month,
    total: grouped[month] ?? 0,
  }));
});

const maxTotal = computed(() => Math.max(1, ...monthTotals.value.map((item) => item.total)));

const bars = computed(() => {
  const count = monthTotals.value.length;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2 - labelHeight;
  const gap = count > 1 ? Math.min(18, innerWidth / count / 3) : 0;
  const barWidth = count > 0 ? (innerWidth - gap * (count - 1)) / count : innerWidth;

  return monthTotals.value.map((month, index) => {
    const x = padding + index * (barWidth + gap);
    const heightRatio = month.total / maxTotal.value;
    const barHeight = Math.max(6, innerHeight * heightRatio);
    const y = padding + innerHeight - barHeight;
    return {
      key: month.key,
      x,
      y,
      width: barWidth,
      height: barHeight,
      label: `${formatMonthLabel(month.key)}: ${formatCents(month.total, props.currency)}`,
    };
  });
});

const labels = computed(() => {
  const count = monthTotals.value.length;
  const innerWidth = width - padding * 2;
  const gap = count > 1 ? Math.min(18, innerWidth / count / 3) : 0;
  const barWidth = count > 0 ? (innerWidth - gap * (count - 1)) / count : innerWidth;
  const y = height - padding + 18;

  return monthTotals.value.map((month, index) => ({
    key: month.key,
    x: padding + index * (barWidth + gap) + barWidth / 2,
    y,
    text: formatMonthLabel(month.key).split(" ")[0],
  }));
});

const gridLines = computed(() => {
  const lines = 4;
  const spacing = (height - padding * 2 - labelHeight) / lines;
  return Array.from({ length: lines + 1 }, (_, index) => padding + index * spacing);
});

const maxLabel = computed(() => labelForExtreme("max"));
const minLabel = computed(() => labelForExtreme("min"));
const trendLabel = computed(() => {
  if (monthTotals.value.length < 2) return "—";
  const latest = monthTotals.value[monthTotals.value.length - 1];
  const previous = monthTotals.value[monthTotals.value.length - 2];
  const delta = latest.total - previous.total;
  const direction = delta >= 0 ? "up" : "down";
  const percent = previous.total ? Math.abs(delta) / previous.total : 0;
  return `${direction} ${formatCents(Math.abs(delta), props.currency)} (${(percent * 100).toFixed(1)}%)`;
});

function labelForExtreme(kind: "min" | "max") {
  if (!monthTotals.value.length) return "—";
  let best = monthTotals.value[0];
  monthTotals.value.forEach((entry) => {
    if (kind === "max" ? entry.total > best.total : entry.total < best.total) {
      best = entry;
    }
  });
  return `${formatCents(best.total, props.currency)} in ${formatMonthLabel(best.key)}`;
}
</script>
