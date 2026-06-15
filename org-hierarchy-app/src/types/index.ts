/**
 * Core data contracts for the org-hierarchy MVP.
 *
 * The model is intentionally a pragmatic subset of the PRD's full data model
 * (sections 6.1 / 6.2). Each uploaded row becomes an `OrgRecord`; the
 * hierarchy engine derives a `HierGraph` of `HierNode`s with calculated
 * fields (layer, spans, report counts). Scenarios are stored as a set of
 * overrides on top of the baseline so the baseline is never mutated.
 */

/** Standard fields a source column can be mapped to (PRD 5.2). */
export type FieldKey =
  // required
  | "id"
  | "managerId"
  | "name"
  // identity / role
  | "positionTitle"
  | "jobTitle"
  | "employeeId"
  | "positionId"
  // org structure
  | "businessUnit"
  | "division"
  | "function"
  | "department"
  | "team"
  // geography
  | "location"
  | "country"
  | "region"
  // finance / legal
  | "costCentre"
  | "legalEntity"
  // grading
  | "grade"
  | "jobLevel"
  | "jobFamily"
  | "jobProfile"
  // employment
  | "employmentType"
  | "workerType"
  | "fte"
  // compensation
  | "baseSalary"
  | "bonus"
  | "allowances"
  | "totalCompensation"
  | "currency"
  // flags / misc
  | "vacancyStatus"
  | "criticalRole"
  | "performanceRating"
  | "tenure";

export interface FieldDef {
  key: FieldKey;
  label: string;
  required: boolean;
  /** Lowercased header substrings used for auto-detection. */
  aliases: string[];
  group: string;
  /** Treated as numeric for metrics / filtering. */
  numeric?: boolean;
}

/** A mapping from standard field -> source column header (or null if unmapped). */
export type ColumnMapping = Partial<Record<FieldKey, string | null>>;

/** A raw uploaded row: header -> string cell value. */
export type RawRow = Record<string, string>;

export interface ParsedFile {
  fileName: string;
  fileType: "csv" | "xlsx";
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rows: RawRow[];
}

/** A normalised record after column mapping. */
export interface OrgRecord {
  id: string;
  managerId: string | null;
  name: string;
  /** All mapped standard fields, keyed by FieldKey. */
  fields: Partial<Record<FieldKey, string>>;
  /** Unmapped columns retained as custom attributes (PRD 5.2). */
  custom: Record<string, string>;
}

export interface HierNode {
  id: string;
  record: OrgRecord;
  parentId: string | null;
  children: string[];
  /** Layer from top; roots are layer 1. */
  depth: number;
  directReports: number;
  totalReports: number;
  isManager: boolean;
}

export interface HierGraph {
  nodes: Map<string, HierNode>;
  roots: string[];
  maxDepth: number;
}

export type IssueLevel = "error" | "warning" | "info";

export interface ValidationIssue {
  level: IssueLevel;
  code: string;
  message: string;
  ids?: string[];
}

export interface ValidationResult {
  issues: ValidationIssue[];
  hasBlockingErrors: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export interface Metrics {
  headcount: number;
  totalFte: number;
  positionCount: number;
  filledPositions: number;
  vacantPositions: number;
  maxLayer: number;
  averageSpan: number;
  medianSpan: number;
  narrowSpanManagers: number;
  wideSpanManagers: number;
  gradeOnGradeCount: number;
  gradeOnGradePct: number;
  individualContributors: number;
  managerCount: number;
  managerToEmployeeRatio: number;
  totalCompensation: number;
  averageCompensation: number;
}

export interface Thresholds {
  narrowSpan: number; // fewer than N direct reports
  wideSpan: number; // more than N direct reports
  layerLimit: number; // roles beyond this layer are flagged
}

export type FilterMode = "include" | "exclude";

export interface CategoryFilter {
  field: FieldKey;
  mode: FilterMode;
  values: string[];
}

export interface RangeFilter {
  field: FieldKey;
  min: number | null;
  max: number | null;
}

export interface FilterState {
  categories: CategoryFilter[];
  ranges: RangeFilter[];
}

export type HighlightRuleId =
  | "narrowSpan"
  | "wideSpan"
  | "gradeOnGrade"
  | "subordinateHigherGrade"
  | "vacancy"
  | "criticalRole"
  | "beyondLayer";

export interface HighlightRule {
  id: HighlightRuleId;
  label: string;
  color: string;
  enabled: boolean;
}

export type ScenarioChangeType = "move" | "remove" | "add" | "updateAttribute";

export interface ScenarioChange {
  id: string;
  type: ScenarioChangeType;
  targetId: string;
  previousManagerId?: string | null;
  newManagerId?: string | null;
  field?: FieldKey;
  previousValue?: string;
  newValue?: string;
  /** The created record, for `add` changes (lets the log fully reconstruct state). */
  record?: OrgRecord;
  timestamp: number;
  comment?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  /** Override of parentId per node id (move changes). */
  parentOverrides: Record<string, string | null>;
  /** Position ids removed in the scenario (their reports move up a level). */
  removed: Record<string, true>;
  /** New positions created in the scenario (e.g. vacant roles). */
  added: OrgRecord[];
  /** Ordered change log (also drives undo/redo with the redo stack). */
  changes: ScenarioChange[];
}

export interface ScenarioComparison {
  movedNodes: { id: string; name: string; from: string; to: string }[];
  removedNodes: { id: string; name: string; compensation: number }[];
  addedNodes: { id: string; name: string; manager: string; compensation: number }[];
  estimatedSavings: number;
  addedCost: number;
  /** Added cost minus removed savings (negative = net saving). */
  netCostChange: number;
  metricDeltas: { key: keyof Metrics; label: string; baseline: number; scenario: number; delta: number }[];
  issuesResolved: number;
  issuesIntroduced: number;
}
