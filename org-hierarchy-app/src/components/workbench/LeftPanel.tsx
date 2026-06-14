import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import { useMetrics, usePopulationIds, useScenarioSavings } from "../../store/derived";
import { distinctValues, hasActiveFilters } from "../../core/filter";
import { FIELD_BY_KEY } from "../../core/fields";
import { exportMetricsCsv } from "../../core/export";
import type { CategoryFilter, FieldKey, Metrics, Thresholds } from "../../types";

const METRIC_ROWS: { key: keyof Metrics; label: string; flag?: boolean; money?: boolean }[] = [
  { key: "headcount", label: "Headcount" },
  { key: "totalFte", label: "Total FTE" },
  { key: "vacantPositions", label: "Vacancies" },
  { key: "maxLayer", label: "Max layer" },
  { key: "averageSpan", label: "Average span" },
  { key: "medianSpan", label: "Median span" },
  { key: "managerCount", label: "Managers" },
  { key: "individualContributors", label: "Individual contributors" },
  { key: "managerToEmployeeRatio", label: "Manager : IC ratio" },
  { key: "narrowSpanManagers", label: "Narrow-span managers", flag: true },
  { key: "wideSpanManagers", label: "Wide-span managers", flag: true },
  { key: "gradeOnGradeCount", label: "Grade-on-grade", flag: true },
  { key: "totalCompensation", label: "Total compensation", money: true },
  { key: "averageCompensation", label: "Average compensation", money: true },
];

const FILTERABLE: FieldKey[] = [
  "function",
  "businessUnit",
  "division",
  "department",
  "team",
  "location",
  "country",
  "region",
  "grade",
  "jobLevel",
  "employmentType",
  "workerType",
  "vacancyStatus",
];

const money = (n: number) => Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function LeftPanel() {
  const metrics = useMetrics();
  const population = usePopulationIds();
  const graph = useStore((s) => s.graph)!;
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const thresholds = useStore((s) => s.thresholds);
  const setThreshold = useStore((s) => s.setThreshold);
  const highlightRules = useStore((s) => s.highlightRules);
  const toggleHighlight = useStore((s) => s.toggleHighlight);
  const gradeOrder = useStore((s) => s.gradeOrder);
  const setGradeOrder = useStore((s) => s.setGradeOrder);
  const scenarioMode = useStore((s) => s.scenarioMode);
  const restorePosition = useStore((s) => s.restorePosition);
  const savings = useScenarioSavings();

  const availableFilters = useMemo(
    () => FILTERABLE.map((f) => ({ field: f, values: distinctValues(graph, f) })).filter((x) => x.values.length > 1),
    [graph],
  );

  function toggleValue(field: FieldKey, value: string) {
    const cats = filters.categories.filter((c) => c.field !== field);
    const existing = filters.categories.find((c) => c.field === field);
    const values = existing ? [...existing.values] : [];
    const idx = values.indexOf(value);
    idx >= 0 ? values.splice(idx, 1) : values.push(value);
    const next: CategoryFilter[] = values.length ? [...cats, { field, mode: "include", values }] : cats;
    setFilters({ ...filters, categories: next });
  }

  function moveGrade(idx: number, dir: -1 | 1) {
    const next = [...gradeOrder];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setGradeOrder(next);
  }

  const selectedValues = (field: FieldKey) =>
    filters.categories.find((c) => c.field === field)?.values ?? [];

  if (!metrics) return null;

  return (
    <div className="panel left">
      <div className="row spread">
        <div className="section-title" style={{ margin: 0 }}>Metrics</div>
        <button className="ghost" style={{ fontSize: 12, padding: "2px 6px" }} onClick={() => exportMetricsCsv(metrics)}>
          Export CSV
        </button>
      </div>
      {population && (
        <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
          Showing {population.size} of {graph.nodes.size} (filtered / focused)
        </div>
      )}
      {METRIC_ROWS.map((row) => (
        <div key={row.key} className={`metric ${row.flag && (metrics[row.key] as number) > 0 ? "flag" : ""}`}>
          <span>{row.label}</span>
          <span className="v">{row.money ? money(metrics[row.key] as number) : metrics[row.key]}</span>
        </div>
      ))}

      {scenarioMode && (
        <>
          <div className="section-title">Scenario impact</div>
          <div className="metric">
            <span>Removed positions</span>
            <span className="v">{savings.removedCount}</span>
          </div>
          <div className="metric" style={{ borderBottom: "none" }}>
            <span>Estimated annual savings</span>
            <span className="v" style={{ color: savings.savings > 0 ? "var(--ok)" : undefined }}>
              {savings.savings > 0 ? Intl.NumberFormat().format(savings.savings) : "—"}
            </span>
          </div>
          {savings.removed.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {savings.removed.map((r) => (
                <div key={r.id} className="row spread" style={{ padding: "3px 0", fontSize: 12 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.name}>
                    {r.name} · {money(r.compensation)}
                  </span>
                  <button
                    className="ghost"
                    style={{ fontSize: 11, padding: "0 6px" }}
                    onClick={() => restorePosition(r.id)}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="section-title">Highlighting</div>
      {highlightRules.map((r) => (
        <label key={r.id} className="chip-toggle">
          <input type="checkbox" checked={r.enabled} onChange={() => toggleHighlight(r.id)} />
          <span className="swatch" style={{ background: r.color }} />
          {r.label}
        </label>
      ))}

      <div className="section-title">Thresholds</div>
      <ThresholdRow label="Narrow span <" k="narrowSpan" value={thresholds.narrowSpan} onChange={setThreshold} />
      <ThresholdRow label="Wide span >" k="wideSpan" value={thresholds.wideSpan} onChange={setThreshold} />
      <ThresholdRow label="Layer limit >" k="layerLimit" value={thresholds.layerLimit} onChange={setThreshold} />

      {gradeOrder.length > 0 && (
        <>
          <div className="section-title">Grade order (junior → senior)</div>
          {gradeOrder.map((g, i) => (
            <div key={g} className="row spread" style={{ padding: "2px 0" }}>
              <span>{g}</span>
              <span className="row" style={{ gap: 4 }}>
                <button className="ghost" style={{ padding: "0 6px" }} onClick={() => moveGrade(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button className="ghost" style={{ padding: "0 6px" }} onClick={() => moveGrade(i, 1)} disabled={i === gradeOrder.length - 1}>
                  ↓
                </button>
              </span>
            </div>
          ))}
        </>
      )}

      <div className="section-title row spread">
        <span>Filters</span>
        {hasActiveFilters(filters) && (
          <button className="ghost" style={{ fontSize: 12, padding: "2px 6px" }} onClick={() => setFilters({ categories: [], ranges: [] })}>
            Reset
          </button>
        )}
      </div>
      {availableFilters.length === 0 && <div className="muted" style={{ fontSize: 12 }}>No filterable fields mapped.</div>}
      {availableFilters.map(({ field, values }) => {
        const sel = selectedValues(field);
        return (
          <details key={field} style={{ marginBottom: 6 }}>
            <summary style={{ cursor: "pointer", fontSize: 13 }}>
              {FIELD_BY_KEY[field].label}
              {sel.length > 0 && <span className="badge info" style={{ marginLeft: 6 }}>{sel.length}</span>}
            </summary>
            <div style={{ maxHeight: 160, overflow: "auto", paddingLeft: 4 }}>
              {values.map((v) => (
                <label key={v} className="chip-toggle" style={{ padding: "2px 0", fontSize: 13 }}>
                  <input type="checkbox" checked={sel.includes(v)} onChange={() => toggleValue(field, v)} />
                  {v}
                </label>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ThresholdRow({
  label,
  k,
  value,
  onChange,
}: {
  label: string;
  k: keyof Thresholds;
  value: number;
  onChange: (k: keyof Thresholds, v: number) => void;
}) {
  return (
    <div className="row spread" style={{ padding: "3px 0" }}>
      <label className="muted" style={{ fontSize: 13 }}>{label}</label>
      <input
        type="number"
        style={{ width: 64 }}
        value={value}
        min={0}
        onChange={(e) => onChange(k, Number(e.target.value))}
      />
    </div>
  );
}
