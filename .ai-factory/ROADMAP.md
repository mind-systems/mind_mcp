# Mind MCP — Roadmap

## Phase 5 — gRPC Migration

### 5.1 Research spike ✓ complete

- [x] **Spike complete** — library stack chosen, proto loading strategy decided, PAT auth approach defined, error mapping utility designed; see `.ai-factory/notes/01-grpc-client-setup.md`

### 5.2 Install dependencies

- [x] **Install gRPC packages** — `npm install @grpc/grpc-js && npm install --save-dev ts-proto` inside `mind_mcp/`

### 5.3 Proto codegen setup

- [x] **Copy proto files and create gen script** — create `mind_mcp/proto/`, copy `breath_sessions.proto` and `auth.proto` from `mind_api/proto/`; create `scripts/gen_proto.sh` that runs `protoc --plugin=ts-proto --ts_proto_out=src/generated/ proto/*.proto`; add `proto:gen` script to `package.json` and document in `CLAUDE.md`
- [x] **Run codegen** — execute script, commit `src/generated/` to repo

### 5.4 Create GrpcClient for mind_mcp

- [x] **Create `src/api/grpc-client.ts`** — reads `MIND_GRPC_URL`, `MIND_PAT_TOKEN`, `MIND_GRPC_TLS` env vars; PAT injected via `grpc.credentials.createFromMetadataGenerator()` combined with channel credentials (automatic on every call, no per-call Metadata); exports same 4 function signatures as current `client.ts` so tool files need no changes; update `.env.example` replacing `MIND_API_URL` with `MIND_GRPC_URL`; see `.ai-factory/notes/01-grpc-client-setup.md` for credential wiring and error mapping details

### 5.5 Migrate each tool

One tool at a time — each is a self-contained file in `src/tools/`.

- [x] **Migrate `src/tools/listSessions.ts`** — replace `client.get('/breath_sessions/list', ...)` with `grpcClient.listSessions(...)`; map `ListSessionsResponse` to the same output shape
- [x] **Migrate `src/tools/getSession.ts`** — replace `client.get('/breath_sessions/${id}')` with `grpcClient.getSession({ id })`; map response
- [x] **Migrate `src/tools/createSession.ts`** — replace `client.post('/breath_sessions', body)` with `grpcClient.createSession(request)`; map request fields to proto message
- [x] **Migrate `src/tools/classifySession.ts`** — replace REST fetch with `grpcClient.getSession({ id })`; LLM formatting logic unchanged
- [x] **Migrate `src/tools/classifyAll.ts`** — replace paginated REST fetch loop with `grpcClient.listSessions(...)` calls; batch logic unchanged
- [x] **Migrate `src/tools/setTimeOfDay.ts`** — replace `client.patch('/breath_sessions/${id}', { timeOfDay })` with `grpcClient.updateSession({ id, timeOfDay })`

### 5.6 Cleanup

- [x] **Delete `src/api/client.ts` and verify** — delete only after all 6 tools are migrated; confirm no remaining `MIND_API_URL` references with `grep -r "MIND_API_URL" src/`

---

## Phase 6 — Cursor + Sections Migration (mind_api Phase 33)

Breaking proto change from API team: `ListSessionsRequest/Response` drop offset pagination in favour of an opaque cursor; each response item now carries a `SessionSection` tag.

- [x] **Copy updated proto and regenerate stubs** — `proto/breath_sessions.proto` is out of sync with `mind_api/proto/` after Phase 33 — copy verbatim from `mind_api/proto/breath_sessions.proto` (single source of truth); run `npm run proto:gen` (verify script name in `package.json`) to regenerate `src/generated/breath_sessions.ts`; commit both files together; do not edit generated files by hand. No TypeScript changes in this milestone. Spec: `.ai-factory/notes/02-proto-copy-cursor-regen.md`.

- [x] **Update `BreathSessionListResponse` in `src/types.ts`** — `BreathSessionListResponse` still has `data: BreathSession[]; total; page; pageSize` — remove all four fields; add `SessionSection = 'STARRED' | 'MINE' | 'SHARED'` type and `SessionListItem { session: BreathSession; section: SessionSection }` interface; replace `BreathSessionListResponse` with `{ items: SessionListItem[]; nextCursor: string | undefined }`. Note: breaks `grpc-client.ts`, `listSessions.ts`, and `classifyAll.ts` compilation until subsequent milestones are done. Spec: `.ai-factory/notes/03-types-cursor-contract.md`. [5m 38s]

- [x] **Update `fetchSessions` in `src/api/grpc-client.ts`** — `fetchSessions` (~line 241) takes a `page` param and maps `resp.data / resp.total / resp.page / resp.pageSize` — remove `page` param; call with `{ cursor: undefined, pageSize }` (first page only, never follow cursor); add `mapSection(ProtoSessionSection): SessionSection` helper using the proto-generated enum; map `resp.items` with `mapSessionWithStarred`; return `{ items, nextCursor }`. Guard: check generated TS enum values (may be numeric 0/1/2) before writing the switch cases. Spec: `.ai-factory/notes/04-grpc-client-cursor-fetch.md`. [16m 33s]

- [x] **Update `src/tools/listSessions.ts` for cursor response shape** — input schema includes `page` and handler maps `result.data` — remove `page` from `inputSchema`; update handler to iterate `result.items` destructuring `{ session, section }`; add `section` to each compact output item; update tool `description` to mention section grouping (`STARRED/MINE/SHARED`). Verify: `npx tsc --noEmit` passes; `list_my_breath_sessions` returns items each with a `section` field, no `total`/`page`/`pageSize` in output. Spec: `.ai-factory/notes/05-list-sessions-cursor-tool.md`. [4m 47s]

- [x] **Migrate `src/tools/classifyAll.ts` to cursor pagination** — `fetchAllSessions` (~line 29) walks pages using `firstPage.data`, `firstPage.total`, and `firstPage.pageSize` — replace the offset loop with cursor iteration: call `fetchSessions({ cursor: undefined })` for the first page, then loop calling `fetchSessions({ cursor: nextCursor })` until `nextCursor` is `undefined`; accumulate `items` from each page; extract `session` from each `SessionListItem` before passing to the LLM batch logic. Verify: `npx tsc --noEmit` passes with no errors in `classifyAll.ts`.

---

## Phase 7 — Re-sync proto: drop ReplaceSession

The `breath_sessions.proto` contract removed the `ReplaceSession` RPC + `ReplaceSessionRequest`. This repo never calls it (the `set_time_of_day` tool already uses `updateSession` PATCH), so this is a pure proto-sync + regen — no TypeScript change — mirroring the Phase 6 copy/regen milestone.

- [x] **Copy updated proto and regenerate stubs 2** — Sync `proto/breath_sessions.proto` to the current contract and regenerate per the proto-sync workflow in `CLAUDE.md` (never hand-edit generated files); run `npm run proto:gen` (`bash scripts/gen_proto.sh`) to regenerate `src/generated/breath_sessions.ts` (the `ReplaceSession` method + `ReplaceSessionRequest` interface disappear); commit both files together. No edits to `src/tools/*` or `src/api/grpc-client.ts`. Verify: `npx tsc --noEmit` passes; `grep -rn "ReplaceSession" src` is empty. Spec: `.ai-factory/notes/06-sync-proto-drop-replacesession.md`. [4m 43s]

---

## Completed

| Milestone | Date |
|-----------|------|
| 5.6 Delete src/api/client.ts and verify | 2026-03-25 |
