# Plan: Migrate `src/tools/classifySession.ts`

## Context

Replace the REST `fetchSession` call in `classifySession.ts` with the gRPC equivalent from `grpc-client.ts`. The function signature is identical (`fetchSession(id: string): Promise<BreathSession>`), so only the import path changes. LLM formatting logic is untouched.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Swap import

- [x] **Task 1: Change `fetchSession` import from REST client to gRPC client**
  Files: `src/tools/classifySession.ts`
  Replace `import { fetchSession } from "../api/client.js"` with `import { fetchSession } from "../api/grpc-client.js"`. No other changes — the function signature and return type are identical across both clients, and the rest of the file (input schema, `formatSessionForClassification`, handler, error handling) stays exactly as-is.
