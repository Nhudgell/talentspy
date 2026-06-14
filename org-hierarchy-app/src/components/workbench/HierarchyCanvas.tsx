import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import { useStore } from "../../store/useStore";
import { useRank, usePopulationIds } from "../../store/derived";
import { nodeHighlight, DEFAULT_HIGHLIGHT_RULES } from "../../core/highlight";
import { changedNodeIds } from "../../core/scenario";
import { OrgNode, type OrgNodeData } from "./OrgNode";
import { layout, NODE_W, NODE_H } from "./layout";
import type { HierGraph } from "../../types";

const nodeTypes = { org: OrgNode };

/** Compute the set of node ids hidden because an ancestor is collapsed. */
function hiddenByCollapse(graph: HierGraph, collapsed: Set<string>): Set<string> {
  const hidden = new Set<string>();
  const walk = (id: string, underCollapsed: boolean) => {
    const node = graph.nodes.get(id);
    if (!node) return;
    if (underCollapsed) hidden.add(id);
    const childCollapsed = underCollapsed || collapsed.has(id);
    for (const c of node.children) walk(c, childCollapsed);
  };
  for (const root of graph.roots) walk(root, false);
  return hidden;
}

function CanvasInner({ flowRef }: { flowRef: React.RefObject<HTMLDivElement> }) {
  const graph = useStore((s) => s.graph)!;
  const selectedId = useStore((s) => s.selectedId);
  const selectNode = useStore((s) => s.selectNode);
  const focusId = useStore((s) => s.focusId);
  const thresholds = useStore((s) => s.thresholds);
  const highlightRules = useStore((s) => s.highlightRules);
  const scenarioMode = useStore((s) => s.scenarioMode);
  const scenario = useStore((s) => s.scenario);
  const moveNode = useStore((s) => s.moveNode);
  const lastMoveError = useStore((s) => s.lastMoveError);
  const clearMoveError = useStore((s) => s.clearMoveError);

  const rank = useRank();
  const population = usePopulationIds();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const changed = useMemo(() => changedNodeIds(scenario), [scenario]);

  // Build React Flow nodes + edges from the graph.
  const computed = useMemo(() => {
    const hidden = hiddenByCollapse(graph, collapsed);
    const focusSet = focusId ? subtreeOf(focusId, graph) : null;

    const rfNodes: Node<OrgNodeData>[] = [];
    const rfEdges: Edge[] = [];

    for (const node of graph.nodes.values()) {
      if (hidden.has(node.id)) continue;
      if (focusSet && !focusSet.has(node.id)) continue;

      const hl = nodeHighlight(node, graph, highlightRules, rank, thresholds);
      const dimmed = !!population && !population.has(node.id);

      rfNodes.push({
        id: node.id,
        type: "org",
        position: { x: 0, y: 0 },
        draggable: scenarioMode,
        data: {
          node,
          selected: node.id === selectedId,
          dimmed,
          changed: changed.has(node.id),
          highlightColor: hl?.color ?? null,
          collapsed: collapsed.has(node.id),
          hiddenChildren: node.totalReports,
          onToggleCollapse: toggleCollapse,
        },
      });

      if (node.parentId && !hidden.has(node.parentId) && (!focusSet || focusSet.has(node.parentId))) {
        rfEdges.push({
          id: `${node.parentId}->${node.id}`,
          source: node.parentId,
          target: node.id,
          type: "smoothstep",
        });
      }
    }
    return { rfNodes, rfEdges };
  }, [graph, collapsed, focusId, selectedId, population, changed, highlightRules, rank, thresholds, scenarioMode, toggleCollapse]);

  const [nodes, setNodes, onNodesChange] = useNodesState<OrgNodeData>([]);
  const [edges, setEdges] = useEdgesState([]);

  const relayout = useCallback(() => {
    setNodes(layout(computed.rfNodes, computed.rfEdges) as Node<OrgNodeData>[]);
    setEdges(computed.rfEdges);
  }, [computed, setNodes, setEdges]);

  useEffect(() => {
    relayout();
  }, [relayout]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => selectNode(node.id), [selectNode]);

  // Drag-to-reparent in scenario mode.
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const onNodeDragStop = useCallback(
    (_: unknown, dragged: Node) => {
      if (!scenarioMode) return;
      const cx = dragged.position.x + NODE_W / 2;
      const cy = dragged.position.y + NODE_H / 2;
      const target = nodesRef.current.find(
        (n) =>
          n.id !== dragged.id &&
          cx >= n.position.x &&
          cx <= n.position.x + NODE_W &&
          cy >= n.position.y &&
          cy <= n.position.y + NODE_H,
      );
      if (target) moveNode(dragged.id, target.id);
      relayout(); // snap back / re-render from the (possibly new) graph
    },
    [scenarioMode, moveNode, relayout],
  );

  return (
    <div className="canvas-wrap" ref={flowRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => selectNode(null)}
        fitView
        minZoom={0.05}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeStrokeWidth={2} />
      </ReactFlow>

      <HighlightLegend />

      {scenarioMode && (
        <div className="legend" style={{ bottom: "auto", top: 12, left: 12 }}>
          Drag a box onto another to re-assign its reporting line.
        </div>
      )}

      {lastMoveError && (
        <div className="toast" onClick={clearMoveError}>
          {lastMoveError} (click to dismiss)
        </div>
      )}
    </div>
  );
}

function HighlightLegend() {
  const rules = useStore((s) => s.highlightRules);
  const active = rules.filter((r) => r.enabled);
  if (active.length === 0) return null;
  return (
    <div className="legend">
      {active.map((r) => (
        <div key={r.id}>
          <span className="swatch" style={{ background: r.color }} />
          {DEFAULT_HIGHLIGHT_RULES.find((d) => d.id === r.id)?.label ?? r.label}
        </div>
      ))}
    </div>
  );
}

function subtreeOf(id: string, graph: HierGraph): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    const n = graph.nodes.get(cur);
    if (n) stack.push(...n.children);
  }
  return out;
}

export function HierarchyCanvas({ flowRef }: { flowRef: React.RefObject<HTMLDivElement> }) {
  return (
    <ReactFlowProvider>
      <CanvasInner flowRef={flowRef} />
    </ReactFlowProvider>
  );
}
