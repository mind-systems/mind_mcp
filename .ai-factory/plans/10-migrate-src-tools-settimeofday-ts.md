# Plan: Migrate `src/tools/setTimeOfDay.ts`

## Context

Switch the last remaining REST-based tool (`setTimeOfDay`) from `api/client.ts` to `api/grpc-client.ts`, using the `patchSession` function already exported by the gRPC client.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Migrate

- [x] **Task 1: Switch import in `src/tools/setTimeOfDay.ts`**
  Files: `src/tools/setTimeOfDay.ts`
  Change the import from `import { patchSession } from "../api/client.js"` to `import { patchSession } from "../api/grpc-client.js"`. No other changes needed — the `patchSession` function in `grpc-client.ts` already has the same signature (`(id: string, data: Partial<BreathSession>) => Promise<BreathSession>`), so the handler body stays identical. Follow the same pattern used in the other five already-migrated tools (e.g. `getSession.ts`, `listSessions.ts`).

- [x] **Task 2: Verify build**
  Files: (none modified)
  Run `npm run build` to confirm TypeScript compiles without errors after the import change.
