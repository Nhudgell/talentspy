import type { HierGraph, HierNode, Metrics, OrgRecord, Thresholds } from "../types";
import { isTruthy, toNumber } from "./parse";

export const DEFAULT_THRESHOLDS: Thresholds = { narrowSpan: 3, wideSpan: 10, layerLimit: 6 };

function compensation(record: OrgRecord): number {
  const total = toNumber(record.fields.totalCompensation);
  if (total != null) return total;
  const base = toNumber(record.fields.baseSalary) ?? 0;
  const bonus = toNumber(record.fields.bonus) ?? 0;
  const allow = toNumber(record.fields.allowances) ?? 0;
  return base + bonus + allow;
}

function isVacant(record: OrgRecord): boolean {
  const v = record.fields.vacancyStatus;
  if (!v) return false;
  return isTruthy(v) || /vacan|open|unfilled/i.test(v);
}

/**
 * Compute metrics over a population (PRD 5.9). `populationIds` restricts the
 * calculation to a filtered set / selected sub-tree; spans are computed
 * relative to that population (a manager's relevant direct reports are those
 * also in the population).
 */
export function computeMetrics(
  graph: HierGraph,
  rank: Map<string, number>,
  thresholds: Thresholds,
  populationIds?: Set<string>,
): Metrics {
  const inPop = (id: string) => !populationIds || populationIds.has(id);
  const population: HierNode[] = [...graph.nodes.values()].filter((n) => inPop(n.id));

  let totalFte = 0;
  let vacant = 0;
  let totalComp = 0;
  let compCount = 0;
  let maxLayer = 0;

  const spans: number[] = [];
  let narrow = 0;
  let wide = 0;
  let managers = 0;
  let gradeOnGrade = 0;
  let gradedChildren = 0;

  for (const node of population) {
    const r = node.record;
    const fteVal = toNumber(r.fields.fte);
    totalFte += fteVal ?? 1;
    if (isVacant(r)) vacant += 1;

    const comp = compensation(r);
    if (comp > 0) {
      totalComp += comp;
      compCount += 1;
    }

    maxLayer = Math.max(maxLayer, node.depth);

    const relevantReports = node.children.filter(inPop);
    if (relevantReports.length > 0) {
      managers += 1;
      const span = relevantReports.length;
      spans.push(span);
      if (span < thresholds.narrowSpan) narrow += 1;
      if (span > thresholds.wideSpan) wide += 1;
    }

    // Grade-on-grade: child grade rank >= parent grade rank.
    if (node.parentId && inPop(node.parentId)) {
      const parent = graph.nodes.get(node.parentId)!;
      const childRank = rank.get(r.fields.grade ?? "");
      const parentRank = rank.get(parent.record.fields.grade ?? "");
      if (childRank != null && parentRank != null) {
        gradedChildren += 1;
        if (childRank >= parentRank) gradeOnGrade += 1;
      }
    }
  }

  const headcount = population.length;
  const managerCount = managers;
  const ics = headcount - managerCount;

  return {
    headcount,
    totalFte: round(totalFte, 1),
    positionCount: headcount,
    filledPositions: headcount - vacant,
    vacantPositions: vacant,
    maxLayer,
    averageSpan: round(mean(spans), 2),
    medianSpan: round(median(spans), 2),
    narrowSpanManagers: narrow,
    wideSpanManagers: wide,
    gradeOnGradeCount: gradeOnGrade,
    gradeOnGradePct: gradedChildren ? round((gradeOnGrade / gradedChildren) * 100, 1) : 0,
    individualContributors: ics,
    managerCount,
    managerToEmployeeRatio: managerCount ? round(ics / managerCount, 2) : 0,
    totalCompensation: Math.round(totalComp),
    averageCompensation: compCount ? Math.round(totalComp / compCount) : 0,
  };
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export { compensation, isVacant };
