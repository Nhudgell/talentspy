import type { ColumnMapping, OrgRecord, ValidationIssue, ValidationResult } from "../types";
import { REQUIRED_FIELDS, FIELD_BY_KEY } from "./fields";

/**
 * Validate mapping + records before hierarchy generation (PRD 5.3).
 * Issues are categorised error (blocking) / warning / info.
 */
export function validate(records: OrgRecord[], mapping: ColumnMapping): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Required field mapping.
  const missingRequired = REQUIRED_FIELDS.filter((k) => !mapping[k]);
  if (missingRequired.length) {
    issues.push({
      level: "error",
      code: "MISSING_REQUIRED_FIELD",
      message: `Required field(s) not mapped: ${missingRequired.map((k) => FIELD_BY_KEY[k].label).join(", ")}.`,
    });
  }

  if (records.length === 0) {
    issues.push({ level: "error", code: "NO_ROWS", message: "The file contains no data rows." });
    return summarise(issues);
  }

  const byId = new Map<string, OrgRecord[]>();
  for (const r of records) {
    const list = byId.get(r.id) ?? [];
    list.push(r);
    byId.set(r.id, list);
  }

  // Duplicate IDs (blocking — ambiguous hierarchy).
  const dupes = [...byId.entries()].filter(([, list]) => list.length > 1).map(([id]) => id);
  if (dupes.length) {
    issues.push({
      level: "error",
      code: "DUPLICATE_ID",
      message: `${dupes.length} duplicate ID(s) found.`,
      ids: dupes.slice(0, 50),
    });
  }

  // Blank ids / names.
  const blankNames = records.filter((r) => !r.name || r.name.startsWith("Row ")).map((r) => r.id);
  if (blankNames.length) {
    issues.push({
      level: "warning",
      code: "BLANK_NAME",
      message: `${blankNames.length} record(s) have a blank name/title.`,
      ids: blankNames.slice(0, 50),
    });
  }

  // Manager references.
  const ids = new Set(records.map((r) => r.id));
  const danglingManagers = records
    .filter((r) => r.managerId != null && !ids.has(r.managerId))
    .map((r) => r.id);
  if (danglingManagers.length) {
    issues.push({
      level: "warning",
      code: "MANAGER_NOT_FOUND",
      message: `${danglingManagers.length} record(s) reference a manager ID not in the file (treated as roots).`,
      ids: danglingManagers.slice(0, 50),
    });
  }

  // Roots.
  const roots = records.filter((r) => r.managerId == null || !ids.has(r.managerId));
  if (roots.length === 0) {
    issues.push({
      level: "error",
      code: "NO_ROOT",
      message: "No root node found — every record reports to another. Likely a circular hierarchy.",
    });
  } else if (roots.length > 1) {
    issues.push({
      level: "warning",
      code: "MULTIPLE_ROOTS",
      message: `${roots.length} root nodes found. Verify this is expected and not a data issue.`,
      ids: roots.map((r) => r.id).slice(0, 50),
    });
  }

  // Cycles (excluding the dangling-manager roots already accounted for).
  const cycleNodes = findCycleNodes(records, ids);
  if (cycleNodes.length) {
    issues.push({
      level: "error",
      code: "CIRCULAR_REPORTING",
      message: `Circular reporting relationship(s) detected involving ${cycleNodes.length} record(s).`,
      ids: cycleNodes.slice(0, 50),
    });
  }

  // Self-reference.
  const selfRef = records.filter((r) => r.managerId === r.id).map((r) => r.id);
  if (selfRef.length) {
    issues.push({
      level: "warning",
      code: "SELF_MANAGER",
      message: `${selfRef.length} record(s) list themselves as their own manager (treated as roots).`,
      ids: selfRef.slice(0, 50),
    });
  }

  // Compensation without currency.
  if (mapping.currency) {
    const compNoCcy = records
      .filter((r) => (r.fields.totalCompensation || r.fields.baseSalary) && !r.fields.currency)
      .map((r) => r.id);
    if (compNoCcy.length) {
      issues.push({
        level: "info",
        code: "COMP_NO_CURRENCY",
        message: `${compNoCcy.length} record(s) have compensation but no currency.`,
        ids: compNoCcy.slice(0, 50),
      });
    }
  }

  // Invalid FTE.
  if (mapping.fte) {
    const badFte = records
      .filter((r) => {
        const v = r.fields.fte;
        if (!v) return false;
        const n = Number(v);
        return !Number.isFinite(n) || n < 0 || n > 2;
      })
      .map((r) => r.id);
    if (badFte.length) {
      issues.push({
        level: "info",
        code: "INVALID_FTE",
        message: `${badFte.length} record(s) have an FTE value outside the expected 0–2 range.`,
        ids: badFte.slice(0, 50),
      });
    }
  }

  return summarise(issues);
}

function findCycleNodes(records: OrgRecord[], ids: Set<string>): string[] {
  const parent = new Map<string, string | null>();
  for (const r of records) {
    const p = r.managerId != null && ids.has(r.managerId) && r.managerId !== r.id ? r.managerId : null;
    parent.set(r.id, p);
  }
  const state = new Map<string, 0 | 1 | 2>(); // 0=unseen 1=in-progress 2=done
  const cycle = new Set<string>();

  for (const start of parent.keys()) {
    if (state.get(start)) continue;
    const path: string[] = [];
    let cur: string | null = start;
    while (cur != null && !state.get(cur)) {
      state.set(cur, 1);
      path.push(cur);
      cur = parent.get(cur) ?? null;
    }
    if (cur != null && state.get(cur) === 1) {
      // Found a cycle entry point; collect from there.
      const idx = path.indexOf(cur);
      for (let i = idx; i >= 0 && i < path.length; i++) cycle.add(path[i]);
    }
    for (const id of path) state.set(id, 2);
  }
  return [...cycle];
}

function summarise(issues: ValidationIssue[]): ValidationResult {
  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;
  const infoCount = issues.filter((i) => i.level === "info").length;
  return { issues, hasBlockingErrors: errorCount > 0, errorCount, warningCount, infoCount };
}
