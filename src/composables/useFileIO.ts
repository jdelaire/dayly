import * as XLSX from "xlsx";
import type { DaylyData } from "../utils/data";
import { validateData } from "../utils/data";
import { toDayKey } from "../utils/date";
import { daylyDataFromWorkbook } from "../utils/excel";

export function useFileIO() {
  function exportData(data: DaylyData) {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dayly-export-${toDayKey(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function readImportFile(file: File) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xlsm") || name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { cellDates: true });
      const payload = daylyDataFromWorkbook(workbook);
      validateData(payload);
      return payload;
    }

    const text = await file.text();
    const payload = JSON.parse(text) as DaylyData;
    validateData(payload);
    return payload;
  }

  return {
    exportData,
    readImportFile,
  };
}
