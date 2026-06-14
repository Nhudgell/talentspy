import type { FieldKey, FilterState, HierGraph, OrgRecord } from "../types";
import { toNumber } from "./parse";

function fieldValue(record: OrgRecord, field: FieldKey): string | undefined {
  if (field === "name") return record.name;
  return record.fields[field];
}

/** Distinct values for a field across the graph (for filter dropdowns). */
export function distinctValues(graph: HierGraph, field: FieldKey): string[] {
  const set = new Set<string>();
  for (const node of graph.nodes.values()) {
    const v = fieldValue(node.record, field);
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** Returns the set of node ids that pass all active filters (PRD 5.8 / 9.1). */
export function applyFilters(graph: HierGraph, filters: FilterState): Set<string> {
  const result = new Set<string>();
  for (const node of graph.nodes.values()) {
    const r = node.record;
    let passes = true;

    for (const cat of filters.categories) {
      if (cat.values.length === 0) continue;
      const v = fieldValue(r, cat.field);
      const matches = v != null && cat.values.includes(v);
      if (cat.mode === "include" && !matches) passes = false;
      if (cat.mode === "exclude" && matches) passes = false;
      if (!passes) break;
    }

    if (passes) {
      for (const range of filters.ranges) {
        const v = toNumber(fieldValue(r, range.field));
        if (range.min != null && (v == null || v < range.min)) passes = false;
        if (range.max != null && (v == null || v > range.max)) passes = false;
        if (!passes) break;
      }
    }

    if (passes) result.add(node.id);
  }
  return result;
}

export const EMPTY_FILTERS: FilterState = { categories: [], ranges: [] };

export function hasActiveFilters(f: FilterState): boolean {
  return f.categories.some((c) => c.values.length > 0) || f.ranges.some((r) => r.min != null || r.max != null);
}
