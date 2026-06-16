# Plan: Copy updated proto and regenerate stubs

## Context
Bring `mind_mcp`'s proto snapshot back in sync with the single source of truth (`mind_api/proto/`) after the Phase 33 cursor-pagination contract change, then regenerate the TypeScript stubs. No hand-written TypeScript changes in this milestone.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Sync proto contract

- [x] **Task 1: Overwrite the local proto with the API source of truth**
  Files: `proto/breath_sessions.proto`
  Replace the entire contents of `mind_mcp/proto/breath_sessions.proto` with a verbatim copy of `mind_api/proto/breath_sessions.proto`. Do not edit, reformat, or partially merge — copy the file exactly. The key contract changes pulled in are: the new `SessionSection` enum (`STARRED=0`, `MINE=1`, `SHARED=2`), the new `SessionListItem` message, `ListSessionsRequest` switching from `int32 page = 1` to `optional string cursor = 1` (tag reuse, confirmed safe), and `ListSessionsResponse` switching from `data/total/page/page_size` to `repeated SessionListItem items = 1` plus `optional string next_cursor = 2`. `mind_mcp` must never modify `.proto` files — this is a pure copy from the upstream owner.

### Phase 2: Regenerate stubs

- [x] **Task 2: Regenerate the generated TypeScript stubs** (depends on Task 1)
  Files: `src/generated/breath_sessions.ts`
  Run `npm run proto:gen` (confirmed script in `package.json` → `bash scripts/gen_proto.sh`, which invokes `protoc` with the `ts_proto` plugin over `proto/*.proto`). Verify the command exits 0. Do not hand-edit the generated output. After regeneration, confirm `src/generated/breath_sessions.ts` contains `SessionSection`, `SessionListItem`, `ListSessionsRequest.cursor`, and `ListSessionsResponse.items` (and no longer references the removed `data/total/page` list shape). Note for the next milestone: check whether the generated `SessionSection` values are numeric (0/1/2) or string names, since that affects `mapSection`.

- [x] **Task 3: Commit both files together** (depends on Task 2)
  Files: `proto/breath_sessions.proto`, `src/generated/breath_sessions.ts`
  Stage and commit the copied proto and the regenerated stub in a single commit so the proto snapshot and its generated output never drift apart. Run git operations inside the `mind_mcp/` repo. Suggested message: "Sync breath_sessions proto with API and regenerate stubs".
