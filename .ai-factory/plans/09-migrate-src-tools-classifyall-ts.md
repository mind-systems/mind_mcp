# Plan: Migrate `src/tools/classifyAll.ts`

## Context
Replace the REST `fetchSessions` import in `classifyAll.ts` with the gRPC equivalent from `grpc-client.ts`. The paginated fetch loop and batch classification logic remain unchanged — only the data source switches from REST to gRPC.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Swap import

- [x] **Task 1: Switch `fetchSessions` import from REST client to gRPC client**
  Files: `src/tools/classifyAll.ts`
  Change the import on line 1 from `"../api/client.js"` to `"../api/grpc-client.js"`. The `fetchSessions` function in `grpc-client.ts` already has the same signature (`(page?: number, pageSize?: number) => Promise<BreathSessionListResponse>`) and returns the same `BreathSession` shapes, so no other code in the file needs to change. Follow the pattern used by the already-migrated tools (`listSessions.ts`, `getSession.ts`, `createSession.ts`, `classifySession.ts`).

### Phase 2: Verify build

- [x] **Task 2: Compile and confirm no type errors** (depends on Task 1)
  Files: (none modified)
  Run `npm run build` to verify the project compiles cleanly after the import swap. The `fetchAllSessions()` pagination loop and the handler's filter/format logic should work unchanged because the return types are identical.
