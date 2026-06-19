# Plan: Copy updated proto and regenerate stubs 2

## Context
Re-sync `proto/breath_sessions.proto` to the current `mind_api` contract (which dropped the `ReplaceSession` RPC + `ReplaceSessionRequest` message) and regenerate `src/generated/breath_sessions.ts`. Pure proto-sync + regen — no TypeScript logic changes.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Sync proto and regenerate

- [x] **Task 1: Copy the source-of-truth proto**
  Files: `proto/breath_sessions.proto`
  Overwrite `mind_mcp/proto/breath_sessions.proto` with the current contract from the single source of truth `mind_api/proto/breath_sessions.proto`. The only difference: the `mind_api` version has already removed the `ReplaceSessionRequest` message (currently lines 111-120) and the `rpc ReplaceSession(...)` line from `service BreathSessionService` (currently line 200). Copy the file explicitly per the proto-sync workflow in `CLAUDE.md` — do not symlink, do not hand-edit beyond copying. After copying, `grep -n "ReplaceSession" proto/breath_sessions.proto` must return nothing.

- [x] **Task 2: Regenerate the TypeScript stub** (depends on Task 1)
  Files: `src/generated/breath_sessions.ts`
  Run `npm run proto:gen` (which executes `bash scripts/gen_proto.sh`) to regenerate the stub. Do NOT hand-edit the generated file. After regeneration the `ReplaceSession` service method and the `ReplaceSessionRequest` interface must be gone. Do not touch `src/tools/*` or `src/api/grpc-client.ts` — `setTimeOfDay` correctly uses `updateSession` (PATCH) and is unaffected.

### Phase 2: Verify

- [x] **Task 3: Verify type-check and absence of references** (depends on Task 2)
  Files: (verification only — no edits)
  Run `npx tsc --noEmit` — it must pass. Run `grep -rn "ReplaceSession\|replaceSession" src` — it must return nothing. If either check fails, fix the proto/regen step (not the generated output) and re-verify.
