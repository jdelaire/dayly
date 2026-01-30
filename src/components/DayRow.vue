<template>
  <li class="day-row">
    <div class="day-label">
      <span class="weekday">{{ weekday }}</span>
      <span class="date">{{ dateNumber }}</span>
    </div>
    <EditableMoney
      :value-cents="valueCents"
      :label="label"
      :currency="currency"
      @save="onSave"
    />
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import EditableMoney from "./EditableMoney.vue";
import { fullDateFormatter, weekdayFormatter } from "../utils/date";

const props = defineProps<{
  day: { date: Date; key: string };
  valueCents?: number;
  currency: string;
}>();
const emit = defineEmits<{ (event: "save", payload: { key: string; cents: number | null }): void }>();

const weekday = computed(() => weekdayFormatter.format(props.day.date));
const dateNumber = computed(() => props.day.date.getDate());
const label = computed(() => `Spend for ${fullDateFormatter.format(props.day.date)}`);

function onSave(cents: number | null) {
  emit("save", { key: props.day.key, cents });
}
</script>
