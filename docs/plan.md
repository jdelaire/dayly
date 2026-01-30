1) Decisions
- Storage mechanism and justification: localStorage with a single JSON blob; simplest offline-first persistence, zero dependencies, and sufficient for small datasets (daily values only).
- Routing choice (single page or vue-router): single page with no router; only one screen and a month selector, so vue-router adds no value.
- How monthly average is computed (choose one default and explain): average over all days in the selected month (including zero-spend days) to reflect true daily spending behavior; computed as total / daysInMonth.
- Import merge strategy details: merge is day-key based; for each YYYY-MM-DD in imported data, overwrite only that day’s value in local data; keep all other local days unchanged; schemaVersion must match.
- Why no additional libraries are needed: date math can be handled with native Date + small helpers; state management via Vue reactivity; file import/export via browser APIs; formatting with Intl.NumberFormat.

2) Data Model
- TypeScript types:
  - type SchemaVersion = 1
  - type DayKey = string // YYYY-MM-DD
  - type MonthKey = string // YYYY-MM
  - interface DaylyData { schemaVersion: SchemaVersion; days: Record<DayKey, number> }
  - interface ImportPayload extends DaylyData {}
- Example persisted JSON object:
  - {"schemaVersion":1,"days":{"2026-01-01":1250,"2026-01-02":0,"2026-01-03":499}}
- Schema versioning approach:
  - Use a numeric schemaVersion in the JSON.
  - Storage key is versioned; on load, validate version and shape.
  - If version mismatches, show a blocking error with option to reset.

3) User Flows
- Enter or edit daily spend:
  - User sees list of days for selected month.
  - Click a day’s value to edit inline; input auto-focuses.
  - Enter number (e.g., dollars) and press Enter to save; Esc or blur cancels.
  - Value stored as integer minor units after parsing/validation.
- Change month:
  - User selects month via native month input.
  - Days list updates; totals and averages recompute instantly.
- Export data:
  - Click “Export JSON”; app serializes DaylyData and downloads file.
- Import data (replace vs merge):
  - Click “Import JSON”; pick file.
  - Validate JSON and schemaVersion.
  - Prompt choice: Replace or Merge.
  - Apply change, persist, and show success toast.

4) Components & Composables
- Components:
  - App.vue: layout, month selector, stats, import/export actions, days list.
  - DayRow.vue: renders single day label + editable value.
  - EditableMoney.vue: inline edit control with enter-to-save.
  - ImportDialog.vue: modal for file selection + replace/merge choice.
- Composables:
  - useDaylyStore: in-memory state, derived stats, update day, load/save.
  - useMonthDays: returns array of days for selected month with local date math.
  - useFileIO: export and import helpers.

5) Persistence & Import Export
- Exact localStorage key name:
  - dayly:v1
- Autosave strategy:
  - Save after any successful day edit and after import.
  - Debounce not required due to tiny payload.
- JSON export format:
  - Exact DaylyData object with schemaVersion and days.
- Import validation steps:
  - Parse JSON.
  - Ensure object with schemaVersion === 1.
  - Ensure days is object; keys match YYYY-MM-DD.
  - Ensure values are integers >= 0 and within max allowed.
- Error handling UX for invalid files:
  - Show a clear inline error in import dialog; do not modify local data.

6) Edge Cases & Validation
- Empty months: show zero total and average; list still shows all days with empty values.
- Current month partial data: “so far” stats show total/average for days up to today; also show full-month stats as default.
- Leap years and month length: days list derived from local Date with correct month length.
- Invalid input (negative values, NaN, extreme numbers): block save, show inline error; clamp max (e.g., 9,999,999 in minor units) and require integer.
- Timezone related pitfalls: use local time; generate day keys via local Date; avoid UTC methods.
- Corrupted localStorage recovery: on load failure, show error with “Reset data” option.

7) Implementation Steps
- Create Vite + Vue 3 + TS project, remove boilerplate.
- Implement DaylyData types and localStorage load/save with versioned key.
- Build useDaylyStore with reactive state and computed totals/averages.
- Build month selector and day list rendering with local date helpers.
- Implement EditableMoney with keyboard save/cancel and validation.
- Wire autosave after updates.
- Add export JSON functionality.
- Add import dialog with replace/merge and validation.
- Add “so far” stats for current month only.
- Add minimal styling for mobile-friendly layout.

8) Minimal Test Plan
- Manual scenarios:
  - Enter values for several days; reload page; values persist.
  - Edit a day, press Enter; verify update and autosave.
  - Switch months; previous month values remain.
  - Current month shows “so far” stats correctly.
  - Export JSON, then import it as replace; data matches.
  - Import with merge; only overlapping dates overwrite.
  - Invalid JSON file shows error and doesn’t change data.
  - February in leap year shows 29 days; non-leap shows 28.
