import { create } from "zustand";
import type {
  ColumnMapping,
  FilterState,
  HierGraph,
  HighlightRule,
  OrgRecord,
  ParsedFile,
  Scenario,
  ScenarioChange,
  Thresholds,
  ValidationResult,
} from "../types";
import { autoDetectMapping } from "../core/fields";
import { buildRecords } from "../core/parse";
import { validate } from "../core/validate";
import { buildHierarchy } from "../core/hierarchy";
import { deriveGradeOrder } from "../core/grades";
import { DEFAULT_THRESHOLDS } from "../core/metrics";
import { DEFAULT_HIGHLIGHT_RULES } from "../core/highlight";
import { EMPTY_FILTERS } from "../core/filter";
import { applyMove, applyScenario, newScenario, validateMove } from "../core/scenario";
import { sampleParsedRows, sampleRecords, SAMPLE_MAPPING } from "../core/sampleData";

type Step = "upload" | "mapping" | "workbench";

interface AppState {
  step: Step;
  parsed: ParsedFile | null;
  mapping: ColumnMapping;
  baseRecords: OrgRecord[];
  validation: ValidationResult | null;
  graph: HierGraph | null;

  gradeOrder: string[];
  thresholds: Thresholds;
  filters: FilterState;
  highlightRules: HighlightRule[];

  selectedId: string | null;
  focusId: string | null;
  search: string;

  scenarioMode: boolean;
  scenario: Scenario | null;
  redoStack: ScenarioChange[];
  lastMoveError: string | null;

  // actions
  loadParsed: (parsed: ParsedFile) => void;
  setMapping: (mapping: ColumnMapping) => void;
  setActiveSheet: (parsed: ParsedFile) => void;
  commitMapping: () => void;
  loadSample: () => void;
  reset: () => void;

  setThreshold: (key: keyof Thresholds, value: number) => void;
  setGradeOrder: (order: string[]) => void;
  setFilters: (filters: FilterState) => void;
  toggleHighlight: (id: HighlightRule["id"]) => void;

  selectNode: (id: string | null) => void;
  setFocus: (id: string | null) => void;
  setSearch: (q: string) => void;

  enterScenarioMode: (name?: string) => void;
  exitScenarioMode: () => void;
  moveNode: (nodeId: string, newManagerId: string) => void;
  undo: () => void;
  redo: () => void;
  resetScenario: () => void;
  clearMoveError: () => void;
}

function rebuildGraph(records: OrgRecord[], scenario: Scenario | null): HierGraph {
  return buildHierarchy(applyScenario(records, scenario));
}

export const useStore = create<AppState>((set, get) => ({
  step: "upload",
  parsed: null,
  mapping: {},
  baseRecords: [],
  validation: null,
  graph: null,

  gradeOrder: [],
  thresholds: { ...DEFAULT_THRESHOLDS },
  filters: EMPTY_FILTERS,
  highlightRules: DEFAULT_HIGHLIGHT_RULES.map((r) => ({ ...r })),

  selectedId: null,
  focusId: null,
  search: "",

  scenarioMode: false,
  scenario: null,
  redoStack: [],
  lastMoveError: null,

  loadParsed: (parsed) =>
    set({ parsed, mapping: autoDetectMapping(parsed.headers), step: "mapping" }),

  setActiveSheet: (parsed) => set({ parsed, mapping: autoDetectMapping(parsed.headers) }),

  setMapping: (mapping) => set({ mapping }),

  commitMapping: () => {
    const { parsed, mapping } = get();
    if (!parsed) return;
    const records = buildRecords(parsed, mapping);
    const validation = validate(records, mapping);
    if (validation.hasBlockingErrors) {
      set({ validation });
      return;
    }
    const gradeOrder = deriveGradeOrder(records);
    set({
      baseRecords: records,
      validation,
      gradeOrder,
      graph: rebuildGraph(records, null),
      step: "workbench",
    });
  },

  loadSample: () => {
    const { headers, rows } = sampleParsedRows();
    const records = sampleRecords();
    const validation = validate(records, SAMPLE_MAPPING);
    set({
      parsed: { fileName: "demo-organisation.csv", fileType: "csv", sheetNames: [], activeSheet: "", headers, rows },
      mapping: SAMPLE_MAPPING,
      baseRecords: records,
      validation,
      gradeOrder: deriveGradeOrder(records),
      graph: rebuildGraph(records, null),
      step: "workbench",
    });
  },

  reset: () =>
    set({
      step: "upload",
      parsed: null,
      mapping: {},
      baseRecords: [],
      validation: null,
      graph: null,
      gradeOrder: [],
      filters: EMPTY_FILTERS,
      selectedId: null,
      focusId: null,
      search: "",
      scenarioMode: false,
      scenario: null,
      redoStack: [],
      highlightRules: DEFAULT_HIGHLIGHT_RULES.map((r) => ({ ...r })),
    }),

  setThreshold: (key, value) => set((s) => ({ thresholds: { ...s.thresholds, [key]: value } })),
  setGradeOrder: (order) => set({ gradeOrder: order }),
  setFilters: (filters) => set({ filters }),
  toggleHighlight: (id) =>
    set((s) => ({
      highlightRules: s.highlightRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    })),

  selectNode: (id) => set({ selectedId: id }),
  setFocus: (id) => set({ focusId: id }),
  setSearch: (q) => set({ search: q }),

  enterScenarioMode: (name = "Scenario 1") => {
    const { scenario, baseRecords } = get();
    set({
      scenarioMode: true,
      scenario: scenario ?? newScenario(name),
      graph: rebuildGraph(baseRecords, scenario ?? null),
    });
  },

  exitScenarioMode: () => {
    const { baseRecords } = get();
    set({ scenarioMode: false, graph: rebuildGraph(baseRecords, null) });
  },

  moveNode: (nodeId, newManagerId) => {
    const { graph, scenario, baseRecords } = get();
    if (!graph || !scenario) return;
    const result = validateMove(nodeId, newManagerId, graph);
    if (!result.ok) {
      set({ lastMoveError: result.error ?? "Invalid move." });
      return;
    }
    const next = applyMove(scenario, nodeId, newManagerId, graph);
    set({
      scenario: next,
      redoStack: [],
      graph: rebuildGraph(baseRecords, next),
      lastMoveError: null,
    });
  },

  undo: () => {
    const { scenario, baseRecords, redoStack } = get();
    if (!scenario || scenario.changes.length === 0) return;
    const changes = [...scenario.changes];
    const undone = changes.pop()!;
    // Recompute overrides from the remaining change log.
    const overrides: Record<string, string | null> = {};
    for (const c of changes) if (c.type === "move") overrides[c.targetId] = c.newManagerId ?? null;
    const next: Scenario = { ...scenario, changes, parentOverrides: overrides };
    set({ scenario: next, redoStack: [...redoStack, undone], graph: rebuildGraph(baseRecords, next) });
  },

  redo: () => {
    const { scenario, baseRecords, redoStack } = get();
    if (!scenario || redoStack.length === 0) return;
    const stack = [...redoStack];
    const change = stack.pop()!;
    const changes = [...scenario.changes, change];
    const overrides: Record<string, string | null> = { ...scenario.parentOverrides };
    if (change.type === "move") overrides[change.targetId] = change.newManagerId ?? null;
    const next: Scenario = { ...scenario, changes, parentOverrides: overrides };
    set({ scenario: next, redoStack: stack, graph: rebuildGraph(baseRecords, next) });
  },

  resetScenario: () => {
    const { scenario, baseRecords } = get();
    if (!scenario) return;
    const next: Scenario = { ...scenario, changes: [], parentOverrides: {} };
    set({ scenario: next, redoStack: [], graph: rebuildGraph(baseRecords, next) });
  },

  clearMoveError: () => set({ lastMoveError: null }),
}));
