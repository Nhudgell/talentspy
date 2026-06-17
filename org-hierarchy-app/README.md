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
| 10 Scenario modelling | ✅ scenario mode, drag-to-reparent, add vacant position, remove position, cost/savings impact, undo/redo, compare |
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

## Data privacy

**Your file is processed entirely in your browser and never uploaded. Any data
used remains locally on your device, within the browser.**

This app is a fully client-side single-page application. There is no backend,
no database, and no upload endpoint — the org data you load never travels to a
server.

### What actually happens to an uploaded file

1. **Read locally.** When you choose a file, the browser reads it into the
   page's memory using native APIs (`File.text()` for CSV, `File.arrayBuffer()`
   for XLSX in `components/upload/UploadScreen.tsx`). The file is not sent
   anywhere.
2. **Parsed locally.** PapaParse (CSV) and SheetJS (XLSX) run as JavaScript
   libraries inside your browser tab. They do not transmit data.
3. **Held in memory only.** The parsed rows, the generated hierarchy, and any
   scenario edits live in an in-memory store (`store/useStore.ts`) — ordinary
   React/Zustand state. Nothing is written to disk.
4. **Rendered locally.** The chart and metrics are computed and drawn from that
   in-memory state.

### Confirmed by the code

- **No network transmission of your data.** There is no `fetch`, `XMLHttpRequest`,
  `axios`, or WebSocket anywhere in `src/` — there is no code path that sends the
  uploaded data off your device, and no upload endpoint exists.
- **No persistence.** There is no `localStorage`, `sessionStorage`, `indexedDB`,
  or cookie storage of your data. The only file-writing action is when *you*
  click an export button, which downloads a CSV/PNG to your own device.
- **Cleared on close.** Because the data is only in tab memory, refreshing or
  closing the tab discards it. There is no "data at rest" copy to delete.

### Honest caveats

- **The host serves the app, not your data.** This site is hosted as static
  files (e.g. on Netlify). The host's standard web logs/analytics see page
  requests (IP, timestamp, URL) like any website, but they do **not** receive
  your file contents, because nothing is uploaded.
- **Local-device exposure still applies.** Since the data sits in your browser's
  memory, it is visible to browser DevTools, browser extensions running on the
  page, and anyone with access to that machine or session. Exported files are
  saved unencrypted to your Downloads folder.
- **No access controls in the MVP.** There is no authentication, role-based
  access, or compensation-field masking — whoever opens the tab sees everything
  in the loaded file. This is the intended MVP posture; the enterprise controls
  in PRD §12 (auth, RBAC, field masking, retention, audit, secure deletion) are
  not implemented.
- **Adding a backend changes this.** The moment saved datasets, shared
  scenarios, audit trails, or HRIS integration are introduced (PRD v2/v3), data
  will need to live on a server, and the §12 controls (encryption at rest,
  RBAC, retention, GDPR deletion-on-request, etc.) become necessary.

For sensitive workforce data, the current "all in the browser" model is a
deliberate privacy strength — at the cost of persistence, collaboration, and
server-side governance.

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
