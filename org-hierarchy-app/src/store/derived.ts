import { useMemo } from "react";
import { useStore } from "./useStore";
import { rankMap } from "../core/grades";
import { applyFilters, hasActiveFilters } from "../core/filter";
import { subtreeIds } from "../core/hierarchy";
import { computeMetrics, compensation } from "../core/metrics";
import type { Metrics } from "../types";

/** Grade -> rank lookup from the current (user-editable) grade order. */
export function useRank(): Map<string, number> {
  const gradeOrder = useStore((s) => s.gradeOrder);
  return useMemo(() => rankMap(gradeOrder), [gradeOrder]);
}

/**
 * Ids in the active population: filter results intersected with the focused
 * sub-tree. `null` means "everything" (no filter, no focus).
 */
export function usePopulationIds(): Set<string> | null {
  const graph = useStore((s) => s.graph);
  const filters = useStore((s) => s.filters);
  const focusId = useStore((s) => s.focusId);

  return useMemo(() => {
    if (!graph) return null;
    const filtered = hasActiveFilters(filters) ? applyFilters(graph, filters) : null;
    const focused = focusId ? subtreeIds(focusId, graph) : null;
    if (!filtered && !focused) return null;
    if (filtered && !focused) return filtered;
    if (!filtered && focused) return focused;
    return new Set([...focused!].filter((id) => filtered!.has(id)));
  }, [graph, filters, focusId]);
}

interface CostLine {
  id: string;
  name: string;
  compensation: number;
}

export interface ScenarioImpact {
  removedCount: number;
  savings: number;
  removed: CostLine[];
  addedCount: number;
  addedCost: number;
  added: CostLine[];
  /** Added cost minus removed savings (negative = net annual saving). */
  netCostChange: number;
}

/**
 * Cost impact of the active scenario: savings from removed positions and cost
 * of newly added positions, using each record's total compensation.
 */
export function useScenarioImpact(): ScenarioImpact {
  const baseRecords = useStore((s) => s.baseRecords);
  const scenario = useStore((s) => s.scenario);
  return useMemo(() => {
    const empty: ScenarioImpact = {
      removedCount: 0,
      savings: 0,
      removed: [],
      addedCount: 0,
      addedCost: 0,
      added: [],
      netCostChange: 0,
    };
    if (!scenario) return empty;

    const byId = new Map(baseRecords.map((r) => [r.id, r]));
    const addedIds = new Set(scenario.added.map((r) => r.id));

    const removed = Object.keys(scenario.removed)
      .filter((id) => !addedIds.has(id))
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map((r) => ({ id: r.id, name: r.name, compensation: compensation(r) }));
    const savings = removed.reduce((sum, r) => sum + r.compensation, 0);

    const added = scenario.added
      .filter((r) => !scenario.removed[r.id])
      .map((r) => ({ id: r.id, name: r.name, compensation: compensation(r) }));
    const addedCost = added.reduce((sum, r) => sum + r.compensation, 0);

    return {
      removedCount: removed.length,
      savings,
      removed,
      addedCount: added.length,
      addedCost,
      added,
      netCostChange: addedCost - savings,
    };
  }, [baseRecords, scenario]);
}

export function useMetrics(): Metrics | null {
  const graph = useStore((s) => s.graph);
  const thresholds = useStore((s) => s.thresholds);
  const rank = useRank();
  const population = usePopulationIds();
  return useMemo(
    () => (graph ? computeMetrics(graph, rank, thresholds, population ?? undefined) : null),
    [graph, rank, thresholds, population],
  );
}
