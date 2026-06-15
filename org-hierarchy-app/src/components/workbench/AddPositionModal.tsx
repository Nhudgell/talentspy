import { useMemo, useState } from "react";
import { useStore } from "../../store/useStore";
import { distinctValues } from "../../core/filter";
import type { FieldKey } from "../../types";

/** Fields offered when creating a vacant position, with datalist suggestions. */
const FORM_FIELDS: { key: FieldKey; label: string; suggest?: boolean; type?: "text" | "number" }[] = [
  { key: "jobTitle", label: "Job title" },
  { key: "grade", label: "Grade", suggest: true },
  { key: "function", label: "Function", suggest: true },
  { key: "department", label: "Department", suggest: true },
  { key: "businessUnit", label: "Business unit", suggest: true },
  { key: "location", label: "Location", suggest: true },
  { key: "country", label: "Country", suggest: true },
  { key: "fte", label: "FTE", type: "number" },
  { key: "totalCompensation", label: "Total compensation", type: "number" },
  { key: "currency", label: "Currency", suggest: true },
];

export function AddPositionModal({ managerId, onClose }: { managerId: string; onClose: () => void }) {
  const graph = useStore((s) => s.graph)!;
  const addPosition = useStore((s) => s.addPosition);
  const manager = graph.nodes.get(managerId);

  // Sensible defaults: inherit function/location/currency from the manager, FTE 1.
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>(() => ({
    fte: "1",
    function: manager?.record.fields.function ?? "",
    location: manager?.record.fields.location ?? "",
    country: manager?.record.fields.country ?? "",
    currency: manager?.record.fields.currency ?? "",
    businessUnit: manager?.record.fields.businessUnit ?? "",
  }));

  const suggestions = useMemo(() => {
    const out: Partial<Record<FieldKey, string[]>> = {};
    for (const f of FORM_FIELDS) if (f.suggest) out[f.key] = distinctValues(graph, f.key);
    return out;
  }, [graph]);

  function set(key: FieldKey, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function submit() {
    addPosition(managerId, values);
    onClose();
  }

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
      <div className="card" style={{ maxWidth: 520, maxHeight: "85vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h2 style={{ margin: 0 }}>Add vacant position</h2>
          <button className="ghost" onClick={onClose}>✕</button>
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          Reports to <strong>{manager?.record.name ?? managerId}</strong>. The role is created as a
          vacancy in this scenario.
        </p>

        <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {FORM_FIELDS.map((f) => (
            <div key={f.key} className="field-row">
              <label>{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={values[f.key] ?? ""}
                list={f.suggest ? `dl-${f.key}` : undefined}
                onChange={(e) => set(f.key, e.target.value)}
              />
              {f.suggest && (
                <datalist id={`dl-${f.key}`}>
                  {(suggestions[f.key] ?? []).map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              )}
            </div>
          ))}
        </div>

        <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={submit}>Add position</button>
        </div>
      </div>
    </div>
  );
}
