import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ColumnMapping, OrgRecord, ParsedFile, RawRow } from "../types";
import { customColumns } from "./fields";

/** Parse a CSV string into headers + string rows. */
export function parseCsv(text: string, fileName: string): ParsedFile {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const headers = result.meta.fields ?? [];
  const rows = (result.data as RawRow[]).map((r) => coerceRow(r, headers));
  return { fileName, fileType: "csv", sheetNames: [], activeSheet: "", headers, rows };
}

/** Parse an XLSX ArrayBuffer; defaults to the first sheet. */
export function parseXlsx(buffer: ArrayBuffer, fileName: string, sheet?: string): ParsedFile {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetNames = wb.SheetNames;
  const activeSheet = sheet && sheetNames.includes(sheet) ? sheet : sheetNames[0];
  const ws = wb.Sheets[activeSheet];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
  const headers = json.length ? Object.keys(json[0]).map((h) => h.trim()) : [];
  const rows = json.map((r) => {
    const out: RawRow = {};
    for (const key of Object.keys(r)) out[key.trim()] = String(r[key] ?? "").trim();
    return out;
  });
  return { fileName, fileType: "xlsx", sheetNames, activeSheet, headers, rows };
}

function coerceRow(row: Record<string, string>, headers: string[]): RawRow {
  const out: RawRow = {};
  for (const h of headers) out[h] = String(row[h] ?? "").trim();
  return out;
}

const TRUTHY = new Set(["true", "yes", "y", "1", "vacant", "critical", "x"]);

export function isTruthy(value: string | undefined): boolean {
  return !!value && TRUTHY.has(value.trim().toLowerCase());
}

export function toNumber(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Build normalised OrgRecords from parsed rows + a column mapping.
 * Unmapped columns are retained as custom attributes (PRD 5.2).
 */
export function buildRecords(parsed: ParsedFile, mapping: ColumnMapping): OrgRecord[] {
  const custom = customColumns(parsed.headers, mapping);
  const idCol = mapping.id;
  const mgrCol = mapping.managerId;
  const nameCol = mapping.name;

  return parsed.rows.map((row, idx) => {
    const id = idCol ? (row[idCol] ?? "").trim() : "";
    const managerRaw = mgrCol ? (row[mgrCol] ?? "").trim() : "";
    const name = nameCol ? (row[nameCol] ?? "").trim() : "";

    const fields: OrgRecord["fields"] = {};
    for (const [key, col] of Object.entries(mapping)) {
      if (!col) continue;
      const v = (row[col] ?? "").trim();
      if (v !== "") fields[key as keyof OrgRecord["fields"]] = v;
    }

    const customAttrs: Record<string, string> = {};
    for (const col of custom) {
      const v = (row[col] ?? "").trim();
      if (v !== "") customAttrs[col] = v;
    }

    return {
      id: id || `__row_${idx}`,
      managerId: managerRaw === "" ? null : managerRaw,
      name: name || id || `Row ${idx + 1}`,
      fields,
      custom: customAttrs,
    };
  });
}
