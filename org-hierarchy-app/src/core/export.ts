import { toPng } from "html-to-image";
import type { Metrics, ScenarioComparison, ValidationResult } from "../types";

function downloadBlob(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

const METRIC_LABELS: Record<keyof Metrics, string> = {
  headcount: "Headcount",
  totalFte: "Total FTE",
  positionCount: "Positions",
  filledPositions: "Filled positions",
  vacantPositions: "Vacant positions",
  maxLayer: "Max layer",
  averageSpan: "Average span",
  medianSpan: "Median span",
  narrowSpanManagers: "Narrow-span managers",
  wideSpanManagers: "Wide-span managers",
  gradeOnGradeCount: "Grade-on-grade count",
  gradeOnGradePct: "Grade-on-grade %",
  individualContributors: "Individual contributors",
  managerCount: "Managers",
  managerToEmployeeRatio: "Manager:IC ratio",
  totalCompensation: "Total compensation",
  averageCompensation: "Average compensation",
};

export function exportMetricsCsv(metrics: Metrics) {
  const rows: (string | number)[][] = [["Metric", "Value"]];
  for (const key of Object.keys(metrics) as (keyof Metrics)[]) {
    rows.push([METRIC_LABELS[key], metrics[key]]);
  }
  downloadBlob(toCsv(rows), "metrics.csv", "text/csv");
}

export function exportValidationCsv(result: ValidationResult) {
  const rows: (string | number)[][] = [["Level", "Code", "Message", "Affected IDs"]];
  for (const i of result.issues) rows.push([i.level, i.code, i.message, (i.ids ?? []).join("; ")]);
  downloadBlob(toCsv(rows), "validation-report.csv", "text/csv");
}

export function exportComparisonCsv(comparison: ScenarioComparison) {
  const rows: (string | number)[][] = [["Metric", "Baseline", "Scenario", "Delta"]];
  for (const d of comparison.metricDeltas) rows.push([d.label, d.baseline, d.scenario, d.delta]);
  rows.push([]);
  rows.push(["Moved node", "From manager", "To manager", ""]);
  for (const m of comparison.movedNodes) rows.push([m.name, m.from, m.to, ""]);
  downloadBlob(toCsv(rows), "scenario-comparison.csv", "text/csv");
}

export async function exportChartPng(element: HTMLElement) {
  const dataUrl = await toPng(element, {
    backgroundColor: "#ffffff",
    filter: (node) =>
      !(node instanceof HTMLElement && node.classList?.contains("react-flow__minimap")) &&
      !(node instanceof HTMLElement && node.classList?.contains("react-flow__controls")),
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "org-chart.png";
  a.click();
}
