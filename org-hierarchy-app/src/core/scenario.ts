import type {
  FieldKey,
  HierGraph,
  Metrics,
  OrgRecord,
  Scenario,
  ScenarioChange,
  ScenarioComparison,
  Thresholds,
} from "../types";
import { buildHierarchy, isAncestor } from "./hierarchy";
import { computeMetrics, compensation } from "./metrics";

export function newScenario(name: string, description = ""): Scenario {
  return {
    id: `scn_${Date.now().toString(36)}`,
    name,
    description,
    createdAt: Date.now(),
    parentOverrides: {},
    removed: {},
    added: [],
    changes: [],
  };
}

function newId(): string {
  return `chg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Derive the scenario's effective state (parent overrides + removed set) by
 * replaying its change log. This is the single source of truth so undo/redo
 * only need to add or drop changes.
 */
export function deriveScenarioState(
  changes: ScenarioChange[],
): Pick<Scenario, "parentOverrides" | "removed" | "added"> {
  const parentOverrides: Record<string, string | null> = {};
  const removed: Record<string, true> = {};
  const addedMap = new Map<string, OrgRecord>();
  for (const c of changes) {
    if (c.type === "move") parentOverrides[c.targetId] = c.newManagerId ?? null;
    else if (c.type === "remove") removed[c.targetId] = true;
    else if (c.type === "add" && c.record) addedMap.set(c.targetId, c.record);
  }
  return { parentOverrides, removed, added: [...addedMap.values()] };
}

/** Build a new vacant position record under a manager (PRD 10.2). */
export function makeVacantPosition(
  managerId: string,
  fields: Partial<Record<FieldKey, string>>,
): OrgRecord {
  const cleaned: Partial<Record<FieldKey, string>> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v != null && String(v).trim() !== "") cleaned[k as FieldKey] = String(v).trim();
  }
  cleaned.vacancyStatus = "Vacant";
  const label = cleaned.jobTitle ?? cleaned.positionTitle;
  return {
    id: `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    managerId,
    name: label ? `Vacant — ${label}` : "Vacant position",
    fields: cleaned,
    custom: {},
  };
}

/**
 * Apply a scenario to baseline records (PRD 10). Moves re-point managers;
 * removals drop the position and re-parent its reports to the nearest
 * surviving ancestor (so a removed manager's team moves up a level).
 */
export function applyScenario(baseline: OrgRecord[], scenario: Scenario | null): OrgRecord[] {
  if (!scenario) return baseline;
  const { parentOverrides, removed, added } = scenario;
  if (
    Object.keys(parentOverrides).length === 0 &&
    Object.keys(removed).length === 0 &&
    added.length === 0
  ) {
    return baseline;
  }

  const all = [...baseline, ...added];
  const managerOf = new Map<string, string | null>();
  for (const r of all) {
    managerOf.set(r.id, r.id in parentOverrides ? parentOverrides[r.id] : r.managerId);
  }

  const resolveManager = (id: string): string | null => {
    let m = managerOf.get(id) ?? null;
    const guard = new Set<string>();
    while (m != null && removed[m]) {
      if (guard.has(m)) return null; // defensive against cycles
      guard.add(m);
      m = managerOf.get(m) ?? null;
    }
    return m ?? null;
  };

  return all
    .filter((r) => !removed[r.id])
    .map((r) => ({ ...r, managerId: resolveManager(r.id) }));
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
    id: newId(),
    type: "move",
    targetId: nodeId,
    previousManagerId: previous,
    newManagerId,
    timestamp: Date.now(),
  };
  const changes = [...scenario.changes, change];
  return { ...scenario, changes, ...deriveScenarioState(changes) };
}

/** Returns a new scenario with the position removed and logged (PRD 10.2). */
export function applyRemove(scenario: Scenario, nodeId: string, graph: HierGraph): Scenario {
  const change: ScenarioChange = {
    id: newId(),
    type: "remove",
    targetId: nodeId,
    previousManagerId: graph.nodes.get(nodeId)?.parentId ?? null,
    timestamp: Date.now(),
  };
  const changes = [...scenario.changes, change];
  return { ...scenario, changes, ...deriveScenarioState(changes) };
}

/** Returns a new scenario with a created position added and logged (PRD 10.2). */
export function applyAdd(scenario: Scenario, record: OrgRecord): Scenario {
  const change: ScenarioChange = {
    id: newId(),
    type: "add",
    targetId: record.id,
    newManagerId: record.managerId,
    record,
    timestamp: Date.now(),
  };
  const changes = [...scenario.changes, change];
  return { ...scenario, changes, ...deriveScenarioState(changes) };
}

/** Restore a previously removed position by dropping its remove change(s). */
export function restorePosition(scenario: Scenario, nodeId: string): Scenario {
  const changes = scenario.changes.filter((c) => !(c.type === "remove" && c.targetId === nodeId));
  return { ...scenario, changes, ...deriveScenarioState(changes) };
}

/** Node ids that differ from baseline (changed in scenario — PRD 8.2). */
export function changedNodeIds(scenario: Scenario | null): Set<string> {
  if (!scenario) return new Set();
  return new Set([
    ...Object.keys(scenario.parentOverrides),
    ...Object.keys(scenario.removed),
    ...scenario.added.map((r) => r.id),
  ]);
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

  const nameOf = (id: string) =>
    scnGraph.nodes.get(id)?.record.name ?? baseGraph.nodes.get(id)?.record.name ?? id;
  const addedIds = new Set(scenario.added.map((r) => r.id));
  const movedNodes = Object.entries(scenario.parentOverrides)
    .filter(([id]) => !scenario.removed[id] && !addedIds.has(id))
    .map(([id, to]) => ({
      id,
      name: nameOf(id),
      from: baseGraph.nodes.get(id)?.parentId ? nameOf(baseGraph.nodes.get(id)!.parentId!) : "(root)",
      to: to ? nameOf(to) : "(root)",
    }));

  const removedNodes = Object.keys(scenario.removed)
    .filter((id) => !addedIds.has(id)) // a created-then-removed position nets to nothing
    .map((id) => ({
      id,
      name: nameOf(id),
      compensation: baseGraph.nodes.get(id) ? compensation(baseGraph.nodes.get(id)!.record) : 0,
    }));
  const estimatedSavings = removedNodes.reduce((sum, n) => sum + n.compensation, 0);

  const addedNodes = scenario.added
    .filter((r) => !scenario.removed[r.id])
    .map((r) => ({
      id: r.id,
      name: r.name,
      manager: scnGraph.nodes.get(r.id)?.parentId ? nameOf(scnGraph.nodes.get(r.id)!.parentId!) : "(root)",
      compensation: compensation(r),
    }));
  const addedCost = addedNodes.reduce((sum, n) => sum + n.compensation, 0);
  const netCostChange = addedCost - estimatedSavings;

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
    removedNodes,
    addedNodes,
    estimatedSavings,
    addedCost,
    netCostChange,
    metricDeltas,
    issuesResolved: diff < 0 ? -diff : 0,
    issuesIntroduced: diff > 0 ? diff : 0,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
