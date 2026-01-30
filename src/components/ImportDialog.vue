<template>
  <dialog ref="dialogRef" class="import-dialog" @close="reset">
    <form @submit.prevent>
      <header>
        <h2>Import JSON</h2>
        <p class="muted">Choose a Dayly export JSON or a monthly Excel file to merge or replace.</p>
      </header>
      <div class="field">
        <label for="importFile">File</label>
        <input
          id="importFile"
          ref="fileInput"
          type="file"
          accept=".json,.xlsx,.xlsm,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          @change="onFileChange"
        />
        <p class="muted">{{ status }}</p>
        <p class="error">{{ error }}</p>
      </div>
      <menu>
        <button class="ghost" type="button" @click="close">Cancel</button>
        <button class="primary" type="button" :disabled="!payload" @click="apply('merge')">
          Merge
        </button>
        <button class="danger" type="button" :disabled="!payload" @click="apply('replace')">
          Replace
        </button>
      </menu>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { DaylyData } from "../utils/data";
import { useFileIO } from "../composables/useFileIO";

const emit = defineEmits<{
  (event: "apply", payload: { mode: "merge" | "replace"; data: DaylyData }): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const payload = ref<DaylyData | null>(null);
const error = ref("");
const status = ref("");
const { readImportFile } = useFileIO();

function open() {
  reset();
  dialogRef.value?.showModal();
}

function close() {
  dialogRef.value?.close();
  reset();
}

function reset() {
  payload.value = null;
  error.value = "";
  status.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  error.value = "";
  status.value = "";
  payload.value = null;

  if (!file) return;

  try {
    payload.value = await readImportFile(file);
    status.value = `Loaded ${Object.keys(payload.value.days).length} days.`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Invalid file.";
  }
}

function apply(mode: "merge" | "replace") {
  if (!payload.value) return;
  emit("apply", { mode, data: payload.value });
  close();
}

defineExpose({ open, close });
</script>
