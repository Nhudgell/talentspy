import type { OrgRecord } from "../types";

/**
 * Grade handling (PRD 7.3). Grades are uploaded as free text, so we derive an
 * ascending ordering (junior -> senior) that the user can later override.
 *
 * Natural sort handles common patterns like G1 < G2 < ... < G10. For text
 * grades (Analyst, Manager, Director) the auto order is alphabetical and
 * usually wrong, so the UI lets the user reorder — `rankMap` consumes whatever
 * ordering it is given.
 */
export function deriveGradeOrder(records: OrgRecord[]): string[] {
  const distinct = new Set<string>();
  for (const r of records) {
    const g = r.fields.grade;
    if (g) distinct.add(g);
  }
  return [...distinct].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );
}

/** Map grade -> rank (index in ascending order). Lower rank = more junior. */
export function rankMap(gradeOrder: string[]): Map<string, number> {
  const m = new Map<string, number>();
  gradeOrder.forEach((g, i) => m.set(g, i));
  return m;
}
