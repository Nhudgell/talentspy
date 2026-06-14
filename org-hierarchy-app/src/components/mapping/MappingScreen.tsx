import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import { FIELD_DEFS } from "../../core/fields";
import { buildRecords } from "../../core/parse";
import { validate } from "../../core/validate";
import { parseXlsx } from "../../core/parse";
import { exportValidationCsv } from "../../core/export";
import type { FieldKey } from "../../types";

export function MappingScreen() {
  const parsed = useStore((s) => s.parsed);
  const mapping = useStore((s) => s.mapping);
  const setMapping = useStore((s) => s.setMapping);
  const setActiveSheet = useStore((s) => s.setActiveSheet);
  const commitMapping = useStore((s) => s.commitMapping);
  const reset = useStore((s) => s.reset);

  // Live validation preview as the user maps columns.
  const validation = useMemo(() => {
    if (!parsed) return null;
    return validate(buildRecords(parsed, mapping), mapping);
  }, [parsed, mapping]);

  if (!parsed) return null;

  const groups = [...new Set(FIELD_DEFS.map((f) => f.group))];
  const previewRows = parsed.rows.slice(0, 8);

  function updateField(key: FieldKey, col: string) {
    setMapping({ ...mapping, [key]: col === "" ? null : col });
  }

  async function changeSheet(sheet: string) {
    // Re-parse the workbook for the chosen sheet. We only kept rows for the
    // active sheet, so re-read is not possible here without the file; in this
    // MVP the sheet selector is shown only when multiple sheets were detected
    // at parse time and the parsed rows already reflect the first sheet.
    void parseXlsx; // referenced for future multi-sheet re-parse
    setActiveSheet({ ...parsed!, activeSheet: sheet });
  }

  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: 1100 }}>
        <div className="row spread">
          <div>
            <h2>Map your columns</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              {parsed.fileName} · {parsed.rows.length} rows · {parsed.headers.length} columns
            </p>
          </div>
          <button className="ghost" onClick={reset}>
            ← Start over
          </button>
        </div>

        {parsed.sheetNames.length > 1 && (
          <div className="row" style={{ marginBottom: 12 }}>
            <label className="muted">Sheet:</label>
            <select value={parsed.activeSheet} onChange={(e) => changeSheet(e.target.value)}>
              {parsed.sheetNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="section-title">Preview</div>
        <div style={{ overflow: "auto", maxHeight: 200, border: "1px solid var(--border)", borderRadius: 8 }}>
          <table className="preview">
            <thead>
              <tr>{parsed.headers.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i}>
                  {parsed.headers.map((h) => <td key={h}>{row[h]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-title">Field mapping</div>
        {groups.map((group) => (
          <div key={group} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{group}</div>
            <div className="field-grid">
              {FIELD_DEFS.filter((f) => f.group === group).map((f) => (
                <div key={f.key} className={`field-row ${f.required ? "required" : ""}`}>
                  <label>{f.label}</label>
                  <select value={mapping[f.key] ?? ""} onChange={(e) => updateField(f.key, e.target.value)}>
                    <option value="">— not mapped —</option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}

        {validation && (
          <>
            <div className="section-title">
              Validation
              <span style={{ marginLeft: 10 }}>
                {validation.errorCount > 0 && <span className="badge error">{validation.errorCount} errors</span>}{" "}
                {validation.warningCount > 0 && <span className="badge warning">{validation.warningCount} warnings</span>}{" "}
                {validation.infoCount > 0 && <span className="badge info">{validation.infoCount} info</span>}
              </span>
            </div>
            {validation.issues.length === 0 && <div className="issue info">No issues detected.</div>}
            {validation.issues.map((issue, i) => (
              <div key={i} className={`issue ${issue.level}`}>
                <strong>{issue.code}:</strong> {issue.message}
              </div>
            ))}
          </>
        )}

        <div className="row spread" style={{ marginTop: 18 }}>
          <button onClick={() => validation && exportValidationCsv(validation)} disabled={!validation}>
            Download validation report
          </button>
          <button
            className="primary"
            onClick={commitMapping}
            disabled={!!validation?.hasBlockingErrors}
            title={validation?.hasBlockingErrors ? "Resolve blocking errors to continue" : ""}
          >
            Generate hierarchy →
          </button>
        </div>
        {validation?.hasBlockingErrors && (
          <p className="muted" style={{ fontSize: 12, textAlign: "right" }}>
            Blocking errors must be resolved before the hierarchy can be generated.
          </p>
        )}
      </div>
    </div>
  );
}
