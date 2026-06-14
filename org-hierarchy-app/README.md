# OrgScope — Organisational Hierarchy & Scenario Modelling (MVP scaffold)

An MVP scaffold for the organisational hierarchy visualisation and scenario
modelling app described in the product PRD. It lets you upload organisational
data, generate an interactive hierarchy, analyse organisational-design metrics,
highlight structural issues, and model future-state scenarios — entirely in the
browser (no backend, no data leaves the page).

## Stack

- **React 18 + TypeScript + Vite**
- **React Flow** + **dagre** for the interactive, auto-laid-out hierarchy
- **Zustand** for application state
- **PapaParse** / **SheetJS (xlsx)** for file parsing
- **html-to-image** for PNG chart export
- **Vitest** for unit tests on the core engine

## Getting started

```bash
cd org-hierarchy-app
npm install
npm run dev        # start the dev server
npm test           # run engine unit tests
npm run build      # typecheck + production build
```

Open the dev URL, then either upload a CSV/XLSX or click **Load demo data** for a
fully synthetic organisation.

## What the MVP covers (mapped to the PRD)

| PRD area | Status in scaffold |
| --- | --- |
| 5.1 Data upload (CSV/XLSX) | ✅ drag-and-drop + file picker, in-browser parsing |
| 5.2 Column mapping | ✅ auto-detection + manual mapping, custom attributes retained |
| 5.3 Validation | ✅ blocking/warning/info issues, downloadable report |
| 5.4 Hierarchy generation | ✅ roots, depth, direct/total reports, cycle-breaking |
| 5.5 Interactive visualisation | ✅ zoom/pan, expand/collapse, focus sub-tree, minimap |
| 5.6 Detail panel | ✅ right-hand panel with all mapped + custom fields |
| 5.7 Search | ✅ search across name/title/team and jump to node |
| 5.8 Filtering | ✅ multi-select category filters, metric recalculation |
| 5.9 Metrics panel | ✅ core MVP metric set, recalculated on filter/focus/scenario |
| 7.3 Grade-on-grade | ✅ user-editable grade ordering |
| 9.3 Highlighting | ✅ default rule set with configurable thresholds |
| 10 Scenario modelling | ✅ scenario mode, drag-to-reparent, remove position (with savings), undo/redo, compare |
| 11 Export | ✅ chart PNG, metrics CSV, comparison CSV, validation CSV |

## Architecture

The core engine is deliberately UI-independent and unit-tested, so it can later
be lifted into a backend service (PRD §13):

```
src/
  types/            # shared data contracts
  core/
    fields.ts       # standard field catalogue + auto-detection
    parse.ts        # CSV/XLSX parsing, record building
    validate.ts     # validation engine (PRD 5.3)
    hierarchy.ts    # tree build + calculated fields (PRD 5.4 / 6.2)
    metrics.ts      # metrics engine (PRD 5.9 / 7)
    grades.ts       # grade ordering (PRD 7.3)
    highlight.ts    # conditional highlighting (PRD 9.3)
    filter.ts       # filtering (PRD 5.8)
    scenario.ts     # scenario apply / validate / compare (PRD 10)
    export.ts       # CSV + PNG export (PRD 11)
    sampleData.ts   # synthetic demo organisation (PRD 12.2)
    __tests__/      # engine unit tests
  store/            # Zustand store + derived-state hooks
  components/
    upload/         # upload screen
    mapping/        # column mapping + validation screen
    workbench/      # main analytical workbench (canvas, panels, scenario)
```

## Deliberately out of MVP scope

In line with PRD §15.3, this scaffold does **not** include: backend
persistence, authentication/RBAC, HRIS integrations, automated FX conversion,
PowerPoint export, real-time collaboration, audit history, or matrix/dotted-line
reporting. The engine is structured to make these additions straightforward.

## Notes & known limitations

- All processing is client-side and in-memory; refreshing the page clears state.
- Layout uses dagre; very large datasets (tens of thousands of nodes) should use
  collapse/focus to stay performant, as anticipated by PRD §8.4.
- XLSX multi-sheet re-selection currently reflects the first sheet at parse time
  (see `MappingScreen`), pending a full multi-sheet re-parse.
