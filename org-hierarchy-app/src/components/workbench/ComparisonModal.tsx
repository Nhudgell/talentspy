import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import { useRank } from "../../store/derived";
import { compareScenario } from "../../core/scenario";
import { exportComparisonCsv } from "../../core/export";

export function ComparisonModal({ onClose }: { onClose: () => void }) {
  const baseRecords = useStore((s) => s.baseRecords);
  const scenario = useStore((s) => s.scenario);
  const thresholds = useStore((s) => s.thresholds);
  const rank = useRank();

  const comparison = useMemo(
    () => (scenario ? compareScenario(baseRecords, scenario, rank, thresholds) : null),
    [baseRecords, scenario, rank, thresholds],
  );

  if (!comparison) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: 720, maxHeight: "85vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h2 style={{ margin: 0 }}>Baseline vs scenario</h2>
          <button className="ghost" onClick={onClose}>✕</button>
        </div>

        <div className="row" style={{ gap: 16, margin: "12px 0", flexWrap: "wrap" }}>
          <span className="badge info">{comparison.movedNodes.length} roles moved</span>
          <span className="badge info">{comparison.removedNodes.length} positions removed</span>
          {comparison.estimatedSavings > 0 && (
            <span className="badge info" style={{ background: "#dcfce7", color: "#166534" }}>
              {Intl.NumberFormat().format(comparison.estimatedSavings)} est. savings
            </span>
          )}
          {comparison.issuesResolved > 0 && <span className="badge info" style={{ background: "#dcfce7", color: "#166534" }}>{comparison.issuesResolved} issues resolved</span>}
          {comparison.issuesIntroduced > 0 && <span className="badge error">{comparison.issuesIntroduced} issues introduced</span>}
        </div>

        <div className="section-title">Metric impact</div>
        <table className="preview" style={{ fontSize: 13 }}>
          <thead>
            <tr><th>Metric</th><th>Baseline</th><th>Scenario</th><th>Δ</th></tr>
          </thead>
          <tbody>
            {comparison.metricDeltas.map((d) => (
              <tr key={d.key}>
                <td>{d.label}</td>
                <td>{d.baseline}</td>
                <td>{d.scenario}</td>
                <td style={{ color: d.delta === 0 ? "var(--muted)" : d.delta > 0 ? "var(--danger)" : "var(--ok)" }}>
                  {d.delta > 0 ? "+" : ""}{d.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="section-title">Moved roles</div>
        {comparison.movedNodes.length === 0 ? (
          <div className="muted">No moves yet.</div>
        ) : (
          <table className="preview" style={{ fontSize: 13 }}>
            <thead>
              <tr><th>Role</th><th>From</th><th>To</th></tr>
            </thead>
            <tbody>
              {comparison.movedNodes.map((m) => (
                <tr key={m.id}><td>{m.name}</td><td>{m.from}</td><td>{m.to}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {comparison.removedNodes.length > 0 && (
          <>
            <div className="section-title">Removed positions</div>
            <table className="preview" style={{ fontSize: 13 }}>
              <thead>
                <tr><th>Position</th><th>Compensation</th></tr>
              </thead>
              <tbody>
                {comparison.removedNodes.map((n) => (
                  <tr key={n.id}><td>{n.name}</td><td>{Intl.NumberFormat().format(n.compensation)}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
          <button className="primary" onClick={() => exportComparisonCsv(comparison)}>Export comparison CSV</button>
        </div>
      </div>
    </div>
  );
}
