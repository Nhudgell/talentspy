import { useMemo } from "react";
import { useStore } from "./useStore";
import { rankMap } from "../core/grades";
import { applyFilters, hasActiveFilters } from "../core/filter";
import { subtreeIds } from "../core/hierarchy";
import { computeMetrics } from "../core/metrics";
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
