# Plan: Migrate `src/tools/createSession.ts`

## Context

Switch the `createSession` tool from the REST client to the gRPC client. The gRPC client already exports a `createSession` function with the same signature (`CreateBreathSessionPayload` → `BreathSession`), including all field mapping (exercises, steps, timeOfDay) handled inside `buildCreateRequest` and `mapSessionDto`. The only change needed is swapping the import path.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Swap import

- [x] **Task 1: Change import from REST client to gRPC client**
  Files: `src/tools/createSession.ts`
  Replace `import { createSession } from "../api/client.js"` with `import { createSession } from "../api/grpc-client.js"`. No other changes — the function name, parameter type (`CreateBreathSessionPayload`), and return type (`BreathSession`) are identical between both clients.

### Phase 2: Build verification

- [x] **Task 2: Compile and verify** (depends on Task 1)
  Files: none (build check)
  Run `npm run build` to confirm TypeScript compiles cleanly with no type errors. The handler code, input schema, and error handling remain unchanged.
