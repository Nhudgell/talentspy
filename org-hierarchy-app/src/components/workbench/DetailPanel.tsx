import { useStore } from "../../store/useStore";
import { FIELD_BY_KEY } from "../../core/fields";
import { compensation } from "../../core/metrics";
import type { FieldKey } from "../../types";

const DETAIL_FIELDS: FieldKey[] = [
  "jobTitle",
  "positionTitle",
  "employeeId",
  "positionId",
  "grade",
  "jobLevel",
  "jobFamily",
  "function",
  "businessUnit",
  "division",
  "department",
  "team",
  "location",
  "country",
  "region",
  "costCentre",
  "legalEntity",
  "fte",
  "employmentType",
  "workerType",
  "currency",
  "vacancyStatus",
  "criticalRole",
  "performanceRating",
  "tenure",
];

export function DetailPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const graph = useStore((s) => s.graph)!;
  const setFocus = useStore((s) => s.setFocus);
  const focusId = useStore((s) => s.focusId);
  const scenario = useStore((s) => s.scenario);

  if (!selectedId) {
    return (
      <div className="panel right">
        <div className="empty">Select a node to see details.</div>
      </div>
    );
  }

  const node = graph.nodes.get(selectedId);
  if (!node) {
    return (
      <div className="panel right">
        <div className="empty">Node not in current view.</div>
      </div>
    );
  }

  const r = node.record;
  const manager = node.parentId ? graph.nodes.get(node.parentId) : null;
  const comp = compensation(r);
  const changes = scenario?.changes.filter((c) => c.targetId === node.id) ?? [];

  return (
    <div className="panel right">
      <div className="section-title" style={{ marginTop: 0 }}>Details</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{r.name}</div>
      <div className="muted">{r.fields.jobTitle ?? r.fields.positionTitle ?? ""}</div>

      <div className="row" style={{ gap: 6, margin: "10px 0" }}>
        <button
          onClick={() => setFocus(focusId === node.id ? null : node.id)}
          className={focusId === node.id ? "primary" : ""}
        >
          {focusId === node.id ? "Clear focus" : "Focus sub-tree"}
        </button>
      </div>

      <div className="kv"><span className="k">ID</span><span className="v">{node.id}</span></div>
      <div className="kv"><span className="k">Manager</span><span className="v">{manager ? manager.record.name : "—"}</span></div>
      <div className="kv"><span className="k">Layer from top</span><span className="v">{node.depth}</span></div>
      <div className="kv"><span className="k">Direct reports</span><span className="v">{node.directReports}</span></div>
      <div className="kv"><span className="k">Total reports</span><span className="v">{node.totalReports}</span></div>
      {comp > 0 && (
        <div className="kv">
          <span className="k">Total compensation</span>
          <span className="v">
            {Intl.NumberFormat().format(comp)} {r.fields.currency ?? ""}
          </span>
        </div>
      )}

      {DETAIL_FIELDS.filter((f) => r.fields[f]).map((f) => (
        <div key={f} className="kv">
          <span className="k">{FIELD_BY_KEY[f].label}</span>
          <span className="v">{r.fields[f]}</span>
        </div>
      ))}

      {Object.keys(r.custom).length > 0 && (
        <>
          <div className="section-title">Custom attributes</div>
          {Object.entries(r.custom).map(([k, v]) => (
            <div key={k} className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>
          ))}
        </>
      )}

      {changes.length > 0 && (
        <>
          <div className="section-title">Scenario changes</div>
          {changes.map((c) => (
            <div key={c.id} className="issue info" style={{ fontSize: 12 }}>
              Moved from {c.previousManagerId ? graph.nodes.get(c.previousManagerId)?.record.name ?? c.previousManagerId : "(root)"} to{" "}
              {c.newManagerId ? graph.nodes.get(c.newManagerId)?.record.name ?? c.newManagerId : "(root)"}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
