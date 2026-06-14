import { describe, it, expect } from "vitest";
import type { OrgRecord } from "../../types";
import { buildHierarchy, isAncestor, subtreeIds } from "../hierarchy";
import { validate } from "../validate";
import { computeMetrics, DEFAULT_THRESHOLDS } from "../metrics";
import { deriveGradeOrder, rankMap } from "../grades";
import { applyMove, applyRemove, applyScenario, newScenario, restorePosition, validateMove, compareScenario } from "../scenario";
import { autoDetectMapping } from "../fields";
import { parseCsv, buildRecords } from "../parse";

function rec(id: string, managerId: string | null, fields: OrgRecord["fields"] = {}, name = id): OrgRecord {
  return { id, managerId, name, fields, custom: {} };
}

// id, manager, grade
const SAMPLE: OrgRecord[] = [
  rec("1", null, { grade: "G4" }, "CEO"),
  rec("2", "1", { grade: "G3" }, "VP A"),
  rec("3", "1", { grade: "G3" }, "VP B"),
  rec("4", "2", { grade: "G3" }, "Mgr"), // grade-on-grade with parent 2 (G3==G3)
  rec("5", "2", { grade: "G1" }, "IC"),
  rec("6", "4", { grade: "G1" }, "IC2"),
];

describe("buildHierarchy", () => {
  it("computes depth, direct and total reports", () => {
    const g = buildHierarchy(SAMPLE);
    expect(g.roots).toEqual(["1"]);
    expect(g.nodes.get("1")!.depth).toBe(1);
    expect(g.nodes.get("4")!.depth).toBe(3);
    expect(g.nodes.get("1")!.directReports).toBe(2);
    expect(g.nodes.get("1")!.totalReports).toBe(5);
    expect(g.nodes.get("2")!.totalReports).toBe(3);
    expect(g.maxDepth).toBe(4);
  });

  it("treats unknown managers as roots", () => {
    const g = buildHierarchy([rec("a", "missing"), rec("b", "a")]);
    expect(g.roots).toContain("a");
    expect(g.nodes.get("a")!.parentId).toBeNull();
  });

  it("breaks cycles instead of looping forever", () => {
    const g = buildHierarchy([rec("x", "y"), rec("y", "x")]);
    expect(g.roots.length).toBeGreaterThanOrEqual(1);
  });

  it("subtreeIds and isAncestor work", () => {
    const g = buildHierarchy(SAMPLE);
    expect([...subtreeIds("2", g)].sort()).toEqual(["2", "4", "5", "6"]);
    expect(isAncestor("1", "6", g)).toBe(true);
    expect(isAncestor("3", "6", g)).toBe(false);
  });
});

describe("validate", () => {
  it("flags duplicate ids as blocking", () => {
    const result = validate([rec("1", null), rec("1", null)], { id: "id", managerId: "m", name: "n" });
    expect(result.hasBlockingErrors).toBe(true);
    expect(result.issues.some((i) => i.code === "DUPLICATE_ID")).toBe(true);
  });

  it("flags missing required mapping", () => {
    const result = validate([rec("1", null)], { id: "id" });
    expect(result.issues.some((i) => i.code === "MISSING_REQUIRED_FIELD")).toBe(true);
  });

  it("detects circular reporting", () => {
    const result = validate([rec("a", "b"), rec("b", "a")], { id: "id", managerId: "m", name: "n" });
    expect(result.issues.some((i) => i.code === "CIRCULAR_REPORTING")).toBe(true);
  });

  it("warns on multiple roots", () => {
    const result = validate([rec("a", null), rec("b", null)], { id: "id", managerId: "m", name: "n" });
    expect(result.issues.some((i) => i.code === "MULTIPLE_ROOTS")).toBe(true);
  });
});

describe("metrics", () => {
  const rank = rankMap(deriveGradeOrder(SAMPLE));
  it("computes headcount, spans and grade-on-grade", () => {
    const g = buildHierarchy(SAMPLE);
    const m = computeMetrics(g, rank, DEFAULT_THRESHOLDS);
    expect(m.headcount).toBe(6);
    expect(m.managerCount).toBe(3); // 1, 2, 4
    expect(m.maxLayer).toBe(4); // 1 -> 2 -> 4 -> 6
    // node 4 reports to node 2, both G3 -> grade-on-grade
    expect(m.gradeOnGradeCount).toBe(1);
  });

  it("respects population subset", () => {
    const g = buildHierarchy(SAMPLE);
    const pop = subtreeIds("2", g);
    const m = computeMetrics(g, rank, DEFAULT_THRESHOLDS, pop);
    expect(m.headcount).toBe(4);
  });
});

describe("grades", () => {
  it("orders G-grades naturally", () => {
    expect(deriveGradeOrder([rec("a", null, { grade: "G10" }), rec("b", null, { grade: "G2" })])).toEqual(["G2", "G10"]);
  });
});

describe("scenario", () => {
  it("blocks circular moves", () => {
    const g = buildHierarchy(SAMPLE);
    expect(validateMove("2", "6", g).ok).toBe(false); // 6 is under 2
    expect(validateMove("5", "3", g).ok).toBe(true);
  });

  it("applies a move and reflects it in the rebuilt graph", () => {
    const g = buildHierarchy(SAMPLE);
    let scn = newScenario("s");
    scn = applyMove(scn, "5", "3", g);
    const records = applyScenario(SAMPLE, scn);
    const g2 = buildHierarchy(records);
    expect(g2.nodes.get("5")!.parentId).toBe("3");
    expect(g2.nodes.get("3")!.directReports).toBe(1);
  });

  it("removes a position and re-parents its reports to the manager", () => {
    const g = buildHierarchy(SAMPLE);
    let scn = newScenario("s");
    scn = applyRemove(scn, "2", g); // 2 manages 4 and 5; their manager is 1
    const records = applyScenario(SAMPLE, scn);
    expect(records.find((r) => r.id === "2")).toBeUndefined();
    const g2 = buildHierarchy(records);
    expect(g2.nodes.get("4")!.parentId).toBe("1");
    expect(g2.nodes.get("5")!.parentId).toBe("1");
    expect(g2.nodes.has("2")).toBe(false);
  });

  it("restore reverses a removal", () => {
    const g = buildHierarchy(SAMPLE);
    let scn = applyRemove(newScenario("s"), "5", g);
    expect(scn.removed["5"]).toBe(true);
    scn = restorePosition(scn, "5");
    expect(scn.removed["5"]).toBeUndefined();
    expect(applyScenario(SAMPLE, scn).some((r) => r.id === "5")).toBe(true);
  });

  it("reports removed positions and estimated savings in the comparison", () => {
    const withComp: OrgRecord[] = [
      rec("1", null, {}, "CEO"),
      rec("2", "1", { totalCompensation: "150000" }, "VP"),
      rec("3", "2", { totalCompensation: "90000" }, "IC"),
    ];
    const g = buildHierarchy(withComp);
    const rank = rankMap(deriveGradeOrder(withComp));
    const scn = applyRemove(newScenario("s"), "2", g);
    const cmp = compareScenario(withComp, scn, rank, DEFAULT_THRESHOLDS);
    expect(cmp.removedNodes).toHaveLength(1);
    expect(cmp.estimatedSavings).toBe(150000);
    // total compensation drops by the removed comp
    const totalDelta = cmp.metricDeltas.find((d) => d.key === "totalCompensation")!;
    expect(totalDelta.delta).toBe(-150000);
  });

  it("produces a comparison with moved nodes", () => {
    const g = buildHierarchy(SAMPLE);
    const rank = rankMap(deriveGradeOrder(SAMPLE));
    let scn = newScenario("s");
    scn = applyMove(scn, "5", "3", g);
    const cmp = compareScenario(SAMPLE, scn, rank, DEFAULT_THRESHOLDS);
    expect(cmp.movedNodes).toHaveLength(1);
    expect(cmp.movedNodes[0].id).toBe("5");
  });
});

describe("parse + mapping", () => {
  it("auto-detects common headers", () => {
    const m = autoDetectMapping(["Employee ID", "Manager ID", "Name", "Grade", "Function"]);
    expect(m.id).toBe("Employee ID");
    expect(m.managerId).toBe("Manager ID");
    expect(m.name).toBe("Name");
    expect(m.grade).toBe("Grade");
  });

  it("parses CSV and retains custom columns", () => {
    const csv = "Employee ID,Manager ID,Name,Pet\n1,,Alex,Dog\n2,1,Bo,Cat";
    const parsed = parseCsv(csv, "x.csv");
    const mapping = autoDetectMapping(parsed.headers);
    const records = buildRecords(parsed, mapping);
    expect(records).toHaveLength(2);
    expect(records[1].managerId).toBe("1");
    expect(records[0].custom.Pet).toBe("Dog");
  });
});
