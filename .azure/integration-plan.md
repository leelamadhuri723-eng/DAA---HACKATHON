# Integration Hand-off

## Backend
- Project folder: `services/api`
- Run command: `node server.js` from `services/api`
- Port: `3001`
- Health endpoint: `GET /api/health`
- Build command: `npm --prefix services/api install`

## Frontend
- Project folder: `services/web`
- Build command: `npm --prefix services/web run build`
- Dev command: `npm --prefix services/web run dev -- --host 0.0.0.0`
- API seam to swap: `services/web/src/api/index.ts`
- Mock files to delete after integration: `services/web/src/api/mockClient.ts`, `services/web/src/api/previewState.ts`, `services/web/src/mocks/` (if present), `services/web/src/data/demo.ts`
- Live wiring contract: replace only the `api` object in `src/api/index.ts` and keep page/hook imports unchanged.

## API routes
- GET `/api/health` — returns service status payload.
- GET `/` — frontend app shell served by Vite dev server.
- GET `/impact` — frontend route for impact drill-down view.

## Database
- Type: none for this scaffold; static frontend plus local API service.
- Migration tool: not applicable.
- Connection env vars: none required for the current scope.
- Requirement: no seed data.

## Shared types
- Shared package: not required for this static app; UI contracts live under `services/web/src/api/types.ts`.
- Typed-client import alias: `./api` / `api` object.

## Services
- Essential: frontend shell, health endpoint, network analysis utilities.
- Enhancement: preview state mock toggles, live-data swap seam.

## Integration Results
- Live API wiring complete: frontend now calls the backend via `services/web/src/api/client.ts` and `src/api/index.ts`.
- Mock data layer removed: `mockClient.ts` and `previewState.ts` are no longer used by the app.
- Backend smoke tests passed for `/api/health`, `/api/network-overview`, and `/api/impact?serverName=Router1`.
- Frontend proxy verified with Vite at `http://localhost:5173/api/network-overview`, returning the same live network payload from the API service.
- Project status: integrated and verified end-to-end.
