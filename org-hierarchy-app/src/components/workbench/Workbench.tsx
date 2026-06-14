import { useRef, useState } from "react";
import { useStore } from "../../store/useStore";
import { TopBar } from "./TopBar";
import { LeftPanel } from "./LeftPanel";
import { DetailPanel } from "./DetailPanel";
import { HierarchyCanvas } from "./HierarchyCanvas";
import { ComparisonModal } from "./ComparisonModal";

export function Workbench() {
  const flowRef = useRef<HTMLDivElement>(null);
  const scenarioMode = useStore((s) => s.scenarioMode);
  const scenario = useStore((s) => s.scenario);
  const [showCompare, setShowCompare] = useState(false);

  return (
    <div className="workbench">
      <TopBar flowRef={flowRef} onCompare={() => setShowCompare(true)} />
      {scenarioMode && (
        <div className="scenario-banner">
          <strong>Scenario mode</strong>
          <span>— editing a future-state model. The baseline is preserved.</span>
          {scenario && scenario.changes.length > 0 && (
            <span className="badge info">{scenario.changes.length} change{scenario.changes.length === 1 ? "" : "s"}</span>
          )}
        </div>
      )}
      <div className="body">
        <LeftPanel />
        <HierarchyCanvas flowRef={flowRef} />
        <DetailPanel />
      </div>
      {showCompare && <ComparisonModal onClose={() => setShowCompare(false)} />}
    </div>
  );
}
