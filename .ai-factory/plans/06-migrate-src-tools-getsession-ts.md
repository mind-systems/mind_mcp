# Plan: Migrate `src/tools/getSession.ts`

## Context

Switch the `getSession` tool from the REST client (`api/client.ts`) to the gRPC client (`api/grpc-client.ts`). The gRPC client already exposes a `fetchSession` function with the same signature and return type, so only the import path needs to change — no handler logic changes required.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Migrate import

- [x] **Task 1: Change `fetchSession` import from REST to gRPC**
  Files: `src/tools/getSession.ts`
  Replace the import `from "../api/client.js"` with `from "../api/grpc-client.js"`. No other changes to the file — the `fetchSession` function in `grpc-client.ts` has the same signature (`(id: string) => Promise<BreathSession>`) and already handles proto-to-DTO mapping internally. Follow the exact pattern used in the already-migrated `src/tools/listSessions.ts`.
