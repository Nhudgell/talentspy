import type { FieldDef, FieldKey, ColumnMapping } from "../types";

/**
 * Standard field catalogue (PRD 5.2). `aliases` drive auto-detection during
 * column mapping; `numeric` marks fields used in range filters / aggregates.
 */
export const FIELD_DEFS: FieldDef[] = [
  { key: "id", label: "Unique ID", required: true, group: "Required", aliases: ["id", "employee id", "emp id", "person id", "position id", "worker id"] },
  { key: "managerId", label: "Manager ID", required: true, group: "Required", aliases: ["manager id", "manager", "supervisor id", "reports to", "manager employee id", "manager position id", "parent id"] },
  { key: "name", label: "Name / Title", required: true, group: "Required", aliases: ["name", "employee name", "full name", "worker", "position title"] },

  { key: "positionTitle", label: "Position Title", required: false, group: "Role", aliases: ["position title", "position"] },
  { key: "jobTitle", label: "Job Title", required: false, group: "Role", aliases: ["job title", "title", "role"] },
  { key: "employeeId", label: "Employee ID", required: false, group: "Role", aliases: ["employee id", "emp id"] },
  { key: "positionId", label: "Position ID", required: false, group: "Role", aliases: ["position id", "pos id"] },

  { key: "businessUnit", label: "Business Unit", required: false, group: "Organisation", aliases: ["business unit", "bu"] },
  { key: "division", label: "Division", required: false, group: "Organisation", aliases: ["division"] },
  { key: "function", label: "Function", required: false, group: "Organisation", aliases: ["function"] },
  { key: "department", label: "Department", required: false, group: "Organisation", aliases: ["department", "dept"] },
  { key: "team", label: "Team", required: false, group: "Organisation", aliases: ["team"] },

  { key: "location", label: "Location", required: false, group: "Geography", aliases: ["location", "site", "office"] },
  { key: "country", label: "Country", required: false, group: "Geography", aliases: ["country"] },
  { key: "region", label: "Region", required: false, group: "Geography", aliases: ["region"] },

  { key: "costCentre", label: "Cost Centre", required: false, group: "Finance", aliases: ["cost centre", "cost center", "cc"] },
  { key: "legalEntity", label: "Legal Entity", required: false, group: "Finance", aliases: ["legal entity", "entity"] },

  { key: "grade", label: "Grade", required: false, group: "Grading", aliases: ["grade", "pay grade"] },
  { key: "jobLevel", label: "Job Level", required: false, group: "Grading", aliases: ["job level", "level"] },
  { key: "jobFamily", label: "Job Family", required: false, group: "Grading", aliases: ["job family", "family"] },
  { key: "jobProfile", label: "Job Profile", required: false, group: "Grading", aliases: ["job profile", "profile"] },

  { key: "employmentType", label: "Employment Type", required: false, group: "Employment", aliases: ["employment type", "contract type"] },
  { key: "workerType", label: "Worker Type", required: false, group: "Employment", aliases: ["worker type"] },
  { key: "fte", label: "FTE", required: false, group: "Employment", aliases: ["fte", "full time equivalent"], numeric: true },

  { key: "baseSalary", label: "Base Salary", required: false, group: "Compensation", aliases: ["base salary", "base pay", "salary"], numeric: true },
  { key: "bonus", label: "Bonus", required: false, group: "Compensation", aliases: ["bonus"], numeric: true },
  { key: "allowances", label: "Allowances", required: false, group: "Compensation", aliases: ["allowances", "allowance"], numeric: true },
  { key: "totalCompensation", label: "Total Compensation", required: false, group: "Compensation", aliases: ["total compensation", "total comp", "tcc", "total reward"], numeric: true },
  { key: "currency", label: "Currency", required: false, group: "Compensation", aliases: ["currency", "ccy"] },

  { key: "vacancyStatus", label: "Vacancy Status", required: false, group: "Flags", aliases: ["vacancy status", "vacant", "filled status", "occupancy"] },
  { key: "criticalRole", label: "Critical Role", required: false, group: "Flags", aliases: ["critical role", "critical", "key role"] },
  { key: "performanceRating", label: "Performance Rating", required: false, group: "Flags", aliases: ["performance rating", "performance", "rating"] },
  { key: "tenure", label: "Tenure", required: false, group: "Flags", aliases: ["tenure", "years of service", "los"], numeric: true },
];

export const FIELD_BY_KEY: Record<FieldKey, FieldDef> = Object.fromEntries(
  FIELD_DEFS.map((f) => [f.key, f]),
) as Record<FieldKey, FieldDef>;

export const REQUIRED_FIELDS: FieldKey[] = FIELD_DEFS.filter((f) => f.required).map((f) => f.key);

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ");
}

/**
 * Auto-detect a column mapping from headers. Exact alias matches win over
 * substring matches; each source column is used at most once.
 */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  const normalised = headers.map((h) => ({ raw: h, norm: normaliseHeader(h) }));

  const tryMatch = (predicate: (norm: string, alias: string) => boolean) => {
    for (const def of FIELD_DEFS) {
      if (mapping[def.key]) continue;
      for (const alias of def.aliases) {
        const hit = normalised.find((h) => !used.has(h.raw) && predicate(h.norm, alias));
        if (hit) {
          mapping[def.key] = hit.raw;
          used.add(hit.raw);
          break;
        }
      }
    }
  };

  tryMatch((norm, alias) => norm === alias); // exact first
  tryMatch((norm, alias) => norm.includes(alias)); // then substring
  return mapping;
}

/** Columns not consumed by the mapping become custom attributes. */
export function customColumns(headers: string[], mapping: ColumnMapping): string[] {
  const mapped = new Set(Object.values(mapping).filter(Boolean) as string[]);
  return headers.filter((h) => !mapped.has(h));
}
