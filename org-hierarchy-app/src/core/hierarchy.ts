import type { HierGraph, HierNode, OrgRecord } from "../types";

/**
 * Build a hierarchy graph from records (PRD 5.4). Calculates parent/child
 * links, direct + total report counts, layer-from-top (roots = 1), manager
 * flag and max depth.
 *
 * Robustness rules:
 *  - A manager id not present in the record set is treated as a root.
 *  - Cycles are broken: a node whose manager chain loops back to itself is
 *    re-parented to root so the graph stays a forest (validation flags the
 *    cycle separately).
 */
export function buildHierarchy(records: OrgRecord[]): HierGraph {
  const nodes = new Map<string, HierNode>();
  const byId = new Map<string, OrgRecord>();
  for (const r of records) byId.set(r.id, r);

  for (const r of records) {
    const managerExists = r.managerId != null && byId.has(r.managerId) && r.managerId !== r.id;
    nodes.set(r.id, {
      id: r.id,
      record: r,
      parentId: managerExists ? r.managerId : null,
      children: [],
      depth: 0,
      directReports: 0,
      totalReports: 0,
      isManager: false,
    });
  }

  // Break cycles: any node that can reach itself via parent links is rooted.
  for (const node of nodes.values()) {
    if (inCycle(node.id, nodes)) node.parentId = null;
  }

  // Wire children.
  const roots: string[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node.id);
    } else {
      roots.push(node.id);
    }
  }

  // Depth (BFS from roots) + manager flag.
  let maxDepth = 0;
  const queue: { id: string; depth: number }[] = roots.map((id) => ({ id, depth: 1 }));
  const seen = new Set<string>();
  while (queue.length) {
    const { id, depth } = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = nodes.get(id)!;
    node.depth = depth;
    node.directReports = node.children.length;
    node.isManager = node.children.length > 0;
    maxDepth = Math.max(maxDepth, depth);
    for (const c of node.children) queue.push({ id: c, depth: depth + 1 });
  }

  // Total reports via post-order accumulation.
  for (const root of roots) computeTotals(root, nodes);

  return { nodes, roots, maxDepth };
}

function inCycle(startId: string, nodes: Map<string, HierNode>): boolean {
  let slow: string | null = startId;
  let fast: string | null = startId;
  while (fast != null) {
    fast = nodes.get(fast)?.parentId ?? null;
    if (fast == null) return false;
    fast = nodes.get(fast)?.parentId ?? null;
    slow = nodes.get(slow!)?.parentId ?? null;
    if (fast != null && slow === fast) return true;
  }
  return false;
}

function computeTotals(id: string, nodes: Map<string, HierNode>): number {
  const node = nodes.get(id)!;
  let total = 0;
  for (const c of node.children) total += 1 + computeTotals(c, nodes);
  node.totalReports = total;
  return total;
}

/** All node ids in the sub-tree rooted at `id` (inclusive). */
export function subtreeIds(id: string, graph: HierGraph): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    const node = graph.nodes.get(cur);
    if (node) stack.push(...node.children);
  }
  return out;
}

/** True if `ancestorId` is an ancestor of (or equal to) `nodeId`. */
export function isAncestor(ancestorId: string, nodeId: string, graph: HierGraph): boolean {
  let cur: string | null = nodeId;
  while (cur != null) {
    if (cur === ancestorId) return true;
    cur = graph.nodes.get(cur)?.parentId ?? null;
  }
  return false;
}
