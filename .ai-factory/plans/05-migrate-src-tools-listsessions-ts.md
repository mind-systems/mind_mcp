# Plan: Migrate `src/tools/listSessions.ts`

## Context

Switch `listSessions.ts` from the REST client to the gRPC client. The gRPC client (`src/api/grpc-client.ts`) already exports a `fetchSessions` function with the same signature and return type (`BreathSessionListResponse`) as the REST client, so the tool logic and output shape stay unchanged — only the import path needs to change.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Swap import

- [x] **Task 1: Change `fetchSessions` import from REST to gRPC**
  Files: `src/tools/listSessions.ts`
  Replace `import { fetchSessions } from "../api/client.js";` with `import { fetchSessions } from "../api/grpc-client.js";`. No other code changes — the function signature (`(page?: number, pageSize?: number) => Promise<BreathSessionListResponse>`) and the compact-mapping logic in the handler remain identical.

### Phase 2: Verify build

- [x] **Task 2: Run `npm run build` and confirm clean compilation**
  Files: (none — build check only)
  Run `npm run build` to ensure TypeScript compiles without errors after the import swap. Fix any type mismatches if they surface (none expected — signatures match).
