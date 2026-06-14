import type { OrgRecord, ColumnMapping } from "../types";

/**
 * Synthetic demo organisation (PRD 12.2 "demo mode using synthetic data").
 * ~40 fully fictional people across functions, grades, and a couple of
 * deliberate design issues (a narrow span, a grade-on-grade report, a vacancy)
 * so the highlighting rules have something to show.
 */
const FUNCTIONS = ["Engineering", "Sales", "Finance", "People", "Operations"];
const LOCATIONS = ["London", "New York", "Berlin", "Singapore"];
const GRADES = ["G1", "G2", "G3", "G4", "G5", "G6"];

interface Seed {
  id: string;
  name: string;
  managerId: string | null;
  title: string;
  grade: string;
  fn: string;
  vacant?: boolean;
  critical?: boolean;
}

const SEED: Seed[] = [
  { id: "1", name: "Alex Rivera", managerId: null, title: "Chief Executive Officer", grade: "G6", fn: "Operations", critical: true },
  { id: "2", name: "Priya Nair", managerId: "1", title: "VP Engineering", grade: "G5", fn: "Engineering", critical: true },
  { id: "3", name: "Tom Becker", managerId: "1", title: "VP Sales", grade: "G5", fn: "Sales" },
  { id: "4", name: "Sara Lund", managerId: "1", title: "CFO", grade: "G5", fn: "Finance", critical: true },
  { id: "5", name: "Maya Osei", managerId: "1", title: "VP People", grade: "G5", fn: "People" },

  { id: "6", name: "Dan Hill", managerId: "2", title: "Director Platform", grade: "G4", fn: "Engineering" },
  { id: "7", name: "Lena Fischer", managerId: "2", title: "Director Product Eng", grade: "G4", fn: "Engineering" },
  // grade-on-grade: subordinate same grade as manager
  { id: "8", name: "Ravi Patel", managerId: "6", title: "Eng Manager", grade: "G4", fn: "Engineering" },
  { id: "9", name: "Jin Park", managerId: "6", title: "Eng Manager", grade: "G3", fn: "Engineering" },
  { id: "10", name: "Chloe Adams", managerId: "8", title: "Senior Engineer", grade: "G2", fn: "Engineering" },
  { id: "11", name: "Omar Said", managerId: "8", title: "Engineer", grade: "G1", fn: "Engineering" },
  { id: "12", name: "Nina Roth", managerId: "9", title: "Senior Engineer", grade: "G2", fn: "Engineering" },
  { id: "13", name: "Vacant", managerId: "9", title: "Engineer", grade: "G1", fn: "Engineering", vacant: true },
  { id: "14", name: "Ines Carvalho", managerId: "7", title: "Eng Manager", grade: "G3", fn: "Engineering" },
  { id: "15", name: "Paulo Reis", managerId: "14", title: "Engineer", grade: "G1", fn: "Engineering" },

  { id: "16", name: "Grace Kim", managerId: "3", title: "Sales Director EMEA", grade: "G4", fn: "Sales" },
  { id: "17", name: "Hassan Ali", managerId: "3", title: "Sales Director APAC", grade: "G4", fn: "Sales" },
  { id: "18", name: "Erin Walsh", managerId: "16", title: "Account Exec", grade: "G2", fn: "Sales" },
  { id: "19", name: "Luca Bianchi", managerId: "16", title: "Account Exec", grade: "G2", fn: "Sales" },
  { id: "20", name: "Mei Tan", managerId: "16", title: "Account Exec", grade: "G2", fn: "Sales" },
  { id: "21", name: "Noah Cohen", managerId: "16", title: "Account Exec", grade: "G2", fn: "Sales" },
  { id: "22", name: "Ava Stone", managerId: "17", title: "Account Exec", grade: "G2", fn: "Sales" },
  { id: "23", name: "Kenji Sato", managerId: "17", title: "Account Exec", grade: "G2", fn: "Sales" },

  { id: "24", name: "Ben Carter", managerId: "4", title: "Finance Director", grade: "G4", fn: "Finance" },
  // narrow span: single direct report chain
  { id: "25", name: "Sofia Marin", managerId: "24", title: "FP&A Lead", grade: "G3", fn: "Finance" },
  { id: "26", name: " On Lee", managerId: "25", title: "Analyst", grade: "G1", fn: "Finance" },
  { id: "27", name: "Hana Yamada", managerId: "4", title: "Controller", grade: "G3", fn: "Finance" },
  { id: "28", name: "Felix Braun", managerId: "27", title: "Accountant", grade: "G1", fn: "Finance" },
  { id: "29", name: "Zoe Clark", managerId: "27", title: "Accountant", grade: "G1", fn: "Finance" },

  { id: "30", name: "Ian Moss", managerId: "5", title: "HR Director", grade: "G4", fn: "People" },
  { id: "31", name: "Lara Vidal", managerId: "30", title: "HRBP", grade: "G3", fn: "People" },
  { id: "32", name: "Sam Okoro", managerId: "30", title: "Recruiter", grade: "G2", fn: "People" },
  { id: "33", name: "Tara Singh", managerId: "30", title: "Recruiter", grade: "G2", fn: "People" },
  { id: "34", name: "Marc Dubois", managerId: "5", title: "Total Reward Lead", grade: "G3", fn: "People" },
];

export function sampleParsedRows(): { headers: string[]; rows: Record<string, string>[] } {
  const headers = [
    "Employee ID",
    "Name",
    "Manager ID",
    "Job Title",
    "Function",
    "Grade",
    "Location",
    "Country",
    "FTE",
    "Total Compensation",
    "Currency",
    "Vacancy Status",
    "Critical Role",
  ];
  const rows = SEED.map((s, i) => {
    const baseComp = 40000 + (GRADES.indexOf(s.grade) + 1) * 22000 + (i % 5) * 1500;
    return {
      "Employee ID": s.id,
      Name: s.name,
      "Manager ID": s.managerId ?? "",
      "Job Title": s.title,
      Function: s.fn,
      Grade: s.grade,
      Location: LOCATIONS[i % LOCATIONS.length],
      Country: LOCATIONS[i % LOCATIONS.length] === "New York" ? "USA" : "Other",
      FTE: "1",
      "Total Compensation": s.vacant ? "" : String(baseComp),
      Currency: "USD",
      "Vacancy Status": s.vacant ? "Vacant" : "Filled",
      "Critical Role": s.critical ? "Yes" : "No",
    };
  });
  return { headers, rows };
}

export const SAMPLE_MAPPING: ColumnMapping = {
  id: "Employee ID",
  name: "Name",
  managerId: "Manager ID",
  jobTitle: "Job Title",
  function: "Function",
  grade: "Grade",
  location: "Location",
  country: "Country",
  fte: "FTE",
  totalCompensation: "Total Compensation",
  currency: "Currency",
  vacancyStatus: "Vacancy Status",
  criticalRole: "Critical Role",
};

/** Build OrgRecords directly for instant demo loading. */
export function sampleRecords(): OrgRecord[] {
  void FUNCTIONS; // referenced for documentation of the synthetic domain
  const { rows } = sampleParsedRows();
  return rows.map((row) => ({
    id: row["Employee ID"],
    managerId: row["Manager ID"] === "" ? null : row["Manager ID"],
    name: row["Name"],
    fields: {
      jobTitle: row["Job Title"],
      function: row["Function"],
      grade: row["Grade"],
      location: row["Location"],
      country: row["Country"],
      fte: row["FTE"],
      totalCompensation: row["Total Compensation"] || undefined,
      currency: row["Currency"],
      vacancyStatus: row["Vacancy Status"],
      criticalRole: row["Critical Role"],
    },
    custom: {},
  }));
}
