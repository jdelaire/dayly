# Progress

- [x] Read docs/plan.md
- [x] Scaffold Vite + Vue 3 + TS structure
- [x] Implement data model, localStorage persistence, and date helpers
- [x] Build core UI components (App, DayRow, EditableMoney)
- [x] Add import/export dialog with merge/replace and validation
- [x] Add stats including "so far" for current month
- [x] Add Excel import (ignoring first 3 sheets, parsing monthly tabs)
- [x] Make month selector list months with data and add currency selector
- [x] Integrate logo/icon assets and remove source folder
- [x] Update visual design and add month-over-month comparison chart

## Notes
- App now lives under `src/` and is wired through Vite (`index.html`, `src/main.ts`).
- localStorage key: `dayly:v1` with schema version validation.
- Import supports merge or replace and validates day keys + values.
- Excel import reads monthly sheets matching `JU25`, `JUL25`, etc. after the first three tabs.
