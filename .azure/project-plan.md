# Project Plan

**Status**: Integrated
**Created**: 2026-10-03
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build a browser-based network failure detection app that preserves the existing graph-analysis logic, critical-server detection, and impact breakdown workflows while making the experience clearer, more maintainable, and easier to use in a modern web interface. The project is designed so that every module is independently testable.

**App Type**: Static + API

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 3. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Static Web Apps | Host the web app and static frontend assets | VITE_APP_ENV | local | Essential |

---

## 4. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | Frontend | ✅ | 22.x |
| npm | Frontend | ✅ | 10.x |
| Vite | Frontend | ❓ | unknown |
| Azure Static Web Apps CLI | Frontend | ❓ | unknown |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| ms-vscode.js-debug | Frontend | ✅ | installed |
| ms-vscode.vscode-typescript-next | Frontend | ✅ | installed |
| Docker Compose | Frontend | ❓ | unknown |

---

## 5. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: Modern data-dense analytics workspace with subtle elevation, rounded panels, and clear emphasis on critical path visibility.
**Typography**: Segoe UI Variable

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1d4ed8` | Brand color for primary actions, critical server highlights, and active navigation |
| `accent` | `#14b8a6` | Secondary accents for summary chips, focus states, and success emphasis |
| `surface` | `#f3f6fb` | Page and panel backgrounds across the graph workspace |
| `text` | `#0f172a` | Body text, labels, and table content |
| `muted` | `#64748b` | Secondary labels, helper text, and timestamps |
| `border` | `#dbe3ee` | Dividers, input outlines, and card separators |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Network Overview | `/` | Display the server graph, network summary, and critical-server list | `header + main + card-list + table` |
| Impact Explorer | `/impact` | Show how the network splits when a critical server fails | `header + split(main|sidebar) + action-bar` |

### Sample Content

```
Network Overview — network:
| Server | Status | Reachability | Risk |
| Gateway | Active | Healthy | Low |
| Router1 | Active | Healthy | Medium |
| Router2 | Active | Healthy | Medium |
| DB | Critical | Degraded | High |

Impact Explorer — critical server: Gateway · Part count: 3
```

---

## 6. Project Structure

```
app/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles/
│   │   └── theme.css
│   ├── components/
│   │   ├── GraphCanvas.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── CriticalServerList.tsx
│   │   ├── ImpactPanel.tsx
│   │   └── SummaryCards.tsx
│   ├── data/
│   │   └── demo.ts
│   ├── hooks/
│   │   └── useNetworkAnalysis.ts
│   └── utils/
│       ├── graph.ts
│       └── layout.ts
├── public/
│   └── favicon.svg
└── tests/
    ├── graph.test.ts
    └── app.test.tsx
```

---

## 7. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check | — | `{ status, services }` | 200, 503 |
| 2 | GET | `/` | Render the graph overview and interactive network analysis UI | — | HTML page with graph, controls, and critical node list | 200 |
| 3 | GET | `/impact` | Render the failure-impact drill-down view | — | HTML page with component split summary | 200 |

---

## 8. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to live data, smoke-test the backend, and create the migrations
3. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging
4. Run the **azure-deploy** agent when ready; it uses **azure-app-onboard** for architecture, cost estimation, IaC generation, provisioning, and health verification
