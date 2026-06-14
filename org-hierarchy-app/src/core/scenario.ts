import type {
  HierGraph,
  Metrics,
  OrgRecord,
  Scenario,
  ScenarioChange,
  ScenarioComparison,
  Thresholds,
} from "../types";
import { buildHierarchy, isAncestor } from "./hierarchy";
import { computeMetrics } from "./metrics";

export function newScenario(name: string, description = ""): Scenario {
  return {
    id: `scn_${Date.now().toString(36)}`,
    name,
    description,
    createdAt: Date.now(),
    parentOverrides: {},
    changes: [],
  };
}

/** Apply a scenario's overrides to baseline records, producing new records. */
export function applyScenario(baseline: OrgRecord[], scenario: Scenario | null): OrgRecord[] {
  if (!scenario || Object.keys(scenario.parentOverrides).length === 0) return baseline;
  return baseline.map((r) =>
    r.id in scenario.parentOverrides ? { ...r, managerId: scenario.parentOverrides[r.id] } : r,
  );
}

export interface MoveResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate a proposed move of `nodeId` under `newManagerId` against the
 * current scenario graph (PRD 10.3). Blocks self-moves and cycles.
 */
export function validateMove(nodeId: string, newManagerId: string, graph: HierGraph): MoveResult {
  if (nodeId === newManagerId) return { ok: false, error: "A node cannot report to itself." };
  if (!graph.nodes.has(newManagerId)) return { ok: false, error: "Target manager not found." };
  if (graph.nodes.get(nodeId)?.parentId === newManagerId)
    return { ok: false, error: "Node already reports to this manager." };
  if (isAncestor(nodeId, newManagerId, graph))
    return { ok: false, error: "Move would create a circular reporting line." };
  return { ok: true };
}

/** Returns a new scenario with the move applied and logged. */
export function applyMove(
  scenario: Scenario,
  nodeId: string,
  newManagerId: string,
  graph: HierGraph,
): Scenario {
  const previous = graph.nodes.get(nodeId)?.parentId ?? null;
  const change: ScenarioChange = {
    id: `chg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    type: "move",
    targetId: nodeId,
    previousManagerId: previous,
    newManagerId,
    timestamp: Date.now(),
  };
  return {
    ...scenario,
    parentOverrides: { ...scenario.parentOverrides, [nodeId]: newManagerId },
    changes: [...scenario.changes, change],
  };
}

/** Node ids that differ from baseline (changed in scenario — PRD 8.2). */
export function changedNodeIds(scenario: Scenario | null): Set<string> {
  return new Set(scenario ? Object.keys(scenario.parentOverrides) : []);
}

/** Compare baseline vs scenario graphs (PRD 10.5). */
export function compareScenario(
  baselineRecords: OrgRecord[],
  scenario: Scenario,
  rank: Map<string, number>,
  thresholds: Thresholds,
): ScenarioComparison {
  const baseGraph = buildHierarchy(baselineRecords);
  const scnGraph = buildHierarchy(applyScenario(baselineRecords, scenario));

  const nameOf = (id: string) => baseGraph.nodes.get(id)?.record.name ?? id;
  const movedNodes = Object.entries(scenario.parentOverrides).map(([id, to]) => ({
    id,
    name: nameOf(id),
    from: baseGraph.nodes.get(id)?.parentId ? nameOf(baseGraph.nodes.get(id)!.parentId!) : "(root)",
    to: to ? nameOf(to) : "(root)",
  }));

  const baseMetrics = computeMetrics(baseGraph, rank, thresholds);
  const scnMetrics = computeMetrics(scnGraph, rank, thresholds);

  const tracked: { key: keyof Metrics; label: string }[] = [
    { key: "maxLayer", label: "Max layer" },
    { key: "averageSpan", label: "Average span" },
    { key: "narrowSpanManagers", label: "Narrow-span managers" },
    { key: "wideSpanManagers", label: "Wide-span managers" },
    { key: "gradeOnGradeCount", label: "Grade-on-grade count" },
    { key: "managerCount", label: "Managers" },
    { key: "managerToEmployeeRatio", label: "Manager:IC ratio" },
    { key: "totalCompensation", label: "Total compensation" },
  ];

  const metricDeltas = tracked.map(({ key, label }) => ({
    key,
    label,
    baseline: baseMetrics[key],
    scenario: scnMetrics[key],
    delta: round(scnMetrics[key] - baseMetrics[key]),
  }));

  // Structural issues = narrow + wide + grade-on-grade (a simple risk proxy).
  const baseIssues = baseMetrics.narrowSpanManagers + baseMetrics.wideSpanManagers + baseMetrics.gradeOnGradeCount;
  const scnIssues = scnMetrics.narrowSpanManagers + scnMetrics.wideSpanManagers + scnMetrics.gradeOnGradeCount;
  const diff = scnIssues - baseIssues;

  return {
    movedNodes,
    metricDeltas,
    issuesResolved: diff < 0 ? -diff : 0,
    issuesIntroduced: diff > 0 ? diff : 0,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
