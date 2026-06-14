import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { isVacant, compensation } from "../../core/metrics";
import type { HierNode } from "../../types";

export interface OrgNodeData {
  node: HierNode;
  selected: boolean;
  dimmed: boolean;
  changed: boolean;
  highlightColor: string | null;
  collapsed: boolean;
  hiddenChildren: number;
  onToggleCollapse: (id: string) => void;
}

function OrgNodeComponent({ data }: NodeProps<OrgNodeData>) {
  const { node, dimmed, changed, highlightColor, collapsed, hiddenChildren, onToggleCollapse } = data;
  const r = node.record;
  const comp = compensation(r);
  const vacant = isVacant(r);

  return (
    <div
      className={`org-node ${data.selected ? "selected" : ""} ${dimmed ? "dimmed" : ""} ${changed ? "changed" : ""}`}
      style={highlightColor ? { borderLeftColor: highlightColor, borderLeftWidth: 6 } : undefined}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="name">{vacant ? "🟦 Vacant position" : r.name}</div>
      <div className="title">{r.fields.jobTitle ?? r.fields.positionTitle ?? "—"}</div>
      <div className="meta">
        <span>
          {r.fields.grade ?? ""} {r.fields.function ? `· ${r.fields.function}` : ""}
        </span>
        <span className="row" style={{ gap: 4 }}>
          {comp > 0 && <span>{Intl.NumberFormat(undefined, { notation: "compact" }).format(comp)}</span>}
          {node.directReports > 0 && <span className="reports">{node.directReports}</span>}
        </span>
      </div>
      {node.directReports > 0 && (
        <button
          className="ghost"
          title={collapsed ? `Expand ${hiddenChildren} reports` : "Collapse"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(node.id);
          }}
          style={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 22,
            height: 22,
            padding: 0,
            borderRadius: "50%",
            background: "#fff",
            lineHeight: "18px",
            fontSize: 12,
          }}
        >
          {collapsed ? "+" : "−"}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export const OrgNode = memo(OrgNodeComponent);
