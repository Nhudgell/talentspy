import { useMemo, useState } from "react";
import { useStore } from "../../store/useStore";
import { exportChartPng } from "../../core/export";
import type { FieldKey } from "../../types";

const SEARCH_FIELDS: FieldKey[] = ["jobTitle", "positionTitle", "function", "department", "businessUnit", "location", "grade"];

export function TopBar({
  flowRef,
  onCompare,
}: {
  flowRef: React.RefObject<HTMLDivElement>;
  onCompare: () => void;
}) {
  const graph = useStore((s) => s.graph)!;
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const selectNode = useStore((s) => s.selectNode);
  const setFocus = useStore((s) => s.setFocus);
  const reset = useStore((s) => s.reset);

  const scenarioMode = useStore((s) => s.scenarioMode);
  const scenario = useStore((s) => s.scenario);
  const redoStack = useStore((s) => s.redoStack);
  const enterScenarioMode = useStore((s) => s.enterScenarioMode);
  const exitScenarioMode = useStore((s) => s.exitScenarioMode);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const resetScenario = useStore((s) => s.resetScenario);

  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { id: string; name: string; sub: string }[] = [];
    for (const node of graph.nodes.values()) {
      const r = node.record;
      const haystack = [r.name, r.id, ...SEARCH_FIELDS.map((f) => r.fields[f] ?? "")].join(" ").toLowerCase();
      if (haystack.includes(q)) {
        out.push({ id: r.id, name: r.name, sub: r.fields.jobTitle ?? r.fields.positionTitle ?? r.id });
        if (out.length >= 30) break;
      }
    }
    return out;
  }, [search, graph]);

  function jumpTo(id: string) {
    selectNode(id);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="topbar">
      <div className="brand" style={{ fontSize: 16 }}>OrgScope</div>

      <div className="search">
        <input
          placeholder="Search people, titles, teams…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && results.length > 0 && (
          <div className="search-results">
            {results.map((r) => (
              <div key={r.id} onMouseDown={() => jumpTo(r.id)}>
                <strong>{r.name}</strong> <span className="muted">· {r.sub}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setFocus(null)} title="Show the whole organisation">Reset view</button>
      <button onClick={() => flowRef.current && exportChartPng(flowRef.current)}>Export PNG</button>

      <div style={{ width: 1, height: 24, background: "var(--border)" }} />

      {!scenarioMode ? (
        <button className="primary" onClick={() => enterScenarioMode()}>
          ◈ Scenario mode
        </button>
      ) : (
        <>
          <span className="badge info">{scenario?.name}</span>
          <button onClick={undo} disabled={!scenario?.changes.length}>↶ Undo</button>
          <button onClick={redo} disabled={redoStack.length === 0}>↷ Redo</button>
          <button onClick={resetScenario} disabled={!scenario?.changes.length}>Reset</button>
          <button onClick={onCompare} disabled={!scenario?.changes.length}>Compare</button>
          <button onClick={exitScenarioMode}>Exit scenario</button>
        </>
      )}

      <button className="ghost" onClick={reset}>New upload</button>
    </div>
  );
}
