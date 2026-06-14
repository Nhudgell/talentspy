import type { HierGraph, HierNode, HighlightRule, HighlightRuleId, Thresholds } from "../types";
import { isTruthy } from "./parse";
import { isVacant } from "./metrics";

export const DEFAULT_HIGHLIGHT_RULES: HighlightRule[] = [
  { id: "narrowSpan", label: "Narrow span (manager)", color: "#f59e0b", enabled: false },
  { id: "wideSpan", label: "Wide span (manager)", color: "#ef4444", enabled: false },
  { id: "gradeOnGrade", label: "Grade-on-grade reporting", color: "#8b5cf6", enabled: false },
  { id: "subordinateHigherGrade", label: "Subordinate higher grade", color: "#ec4899", enabled: false },
  { id: "vacancy", label: "Vacant position", color: "#0ea5e9", enabled: false },
  { id: "criticalRole", label: "Critical role", color: "#10b981", enabled: false },
  { id: "beyondLayer", label: "Beyond layer limit", color: "#dc2626", enabled: false },
];

/** Evaluate which enabled rules a node matches; returns the colour to use. */
export function nodeHighlight(
  node: HierNode,
  graph: HierGraph,
  rules: HighlightRule[],
  rank: Map<string, number>,
  thresholds: Thresholds,
): { color: string; matched: HighlightRuleId[] } | null {
  const matched: HighlightRuleId[] = [];
  let color: string | null = null;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (matchesRule(rule.id, node, graph, rank, thresholds)) {
      matched.push(rule.id);
      if (!color) color = rule.color; // first enabled match wins (priority by order)
    }
  }
  return color ? { color, matched } : null;
}

function matchesRule(
  id: HighlightRuleId,
  node: HierNode,
  graph: HierGraph,
  rank: Map<string, number>,
  thresholds: Thresholds,
): boolean {
  const r = node.record;
  switch (id) {
    case "narrowSpan":
      return node.isManager && node.directReports < thresholds.narrowSpan;
    case "wideSpan":
      return node.directReports > thresholds.wideSpan;
    case "vacancy":
      return isVacant(r);
    case "criticalRole":
      return isTruthy(r.fields.criticalRole);
    case "beyondLayer":
      return node.depth > thresholds.layerLimit;
    case "gradeOnGrade":
    case "subordinateHigherGrade": {
      if (!node.parentId) return false;
      const parent = graph.nodes.get(node.parentId);
      if (!parent) return false;
      const childRank = rank.get(r.fields.grade ?? "");
      const parentRank = rank.get(parent.record.fields.grade ?? "");
      if (childRank == null || parentRank == null) return false;
      return id === "gradeOnGrade" ? childRank >= parentRank : childRank > parentRank;
    }
  }
}
