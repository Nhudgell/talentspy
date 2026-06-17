import { useRef, useState } from "react";
import { useStore } from "../../store/useStore";
import { parseCsv, parseXlsx } from "../../core/parse";

export function UploadScreen() {
  const loadParsed = useStore((s) => s.loadParsed);
  const loadSample = useStore((s) => s.loadSample);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
        loadParsed(parseCsv(await file.text(), file.name));
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        loadParsed(parseXlsx(await file.arrayBuffer(), file.name));
      } else {
        setError("Unsupported file type. Please upload a CSV or XLSX file.");
      }
    } catch (e) {
      setError(`Could not read file: ${(e as Error).message}`);
    }
  }

  return (
    <div className="screen">
      <div className="card">
        <div className="brand" style={{ marginBottom: 4 }}>
          OrgScope <small>· organisational hierarchy & scenario modelling</small>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Upload an organisational data file to generate an interactive hierarchy, analyse
          spans, layers, grades and cost, and model future-state scenarios. Files are
          processed entirely in your browser.
        </p>

        <div
          className={`dropzone ${drag ? "drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <p style={{ fontSize: 16, margin: "0 0 8px", color: "var(--text)" }}>
            Drag a CSV or XLSX file here
          </p>
          <p style={{ margin: "0 0 16px" }}>or</p>
          <button className="primary" onClick={() => inputRef.current?.click()}>
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {error && <div className="issue error" style={{ marginTop: 12 }}>{error}</div>}

        <div
          className="issue info"
          style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start" }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">🔒</span>
          <div>
            <strong>Your data stays private.</strong> Your file is processed entirely in your
            browser and never uploaded. Any data used will remain locally on your laptop, within
            the browser.
          </div>
        </div>

        <div className="divider" />
        <div className="row spread">
          <div className="muted" style={{ fontSize: 13 }}>
            Need a starting point? Load a fully synthetic demo organisation.
          </div>
          <button onClick={loadSample}>Load demo data</button>
        </div>

        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          Required columns: a unique ID, a manager ID, and a name or title. Everything else is
          optional and can be mapped on the next screen.
        </p>
      </div>
    </div>
  );
}
