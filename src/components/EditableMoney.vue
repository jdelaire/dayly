<template>
  <div class="day-value">
    <button v-if="!editing" type="button" :class="{ empty: valueCents === undefined }" @click="startEdit">
      {{ valueCents === undefined ? "—" : formattedValue }}
    </button>
    <div v-else>
      <input
        ref="inputRef"
        type="text"
        inputmode="decimal"
        :aria-label="label"
        v-model="inputValue"
        @keydown.enter.prevent="save"
        @keydown.esc.prevent="cancel"
        @blur="cancel"
      />
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { formatCents, formatEditableCents, parseMoneyToCents } from "../utils/money";

const props = defineProps<{ valueCents?: number; label: string; currency: string }>();
const emit = defineEmits<{ (event: "save", value: number | null): void }>();

const editing = ref(false);
const inputValue = ref("");
const error = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const formattedValue = computed(() => formatCents(props.valueCents ?? 0, props.currency));

function startEdit() {
  editing.value = true;
  error.value = "";
  inputValue.value = formatEditableCents(props.valueCents);

  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}

function save() {
  const result = parseMoneyToCents(inputValue.value, props.currency);
  if ("error" in result) {
    error.value = result.error;
    return;
  }

  emit("save", result.cents);
  editing.value = false;
}

function cancel() {
  editing.value = false;
  error.value = "";
}
</script>
