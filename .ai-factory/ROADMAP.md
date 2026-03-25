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

- [ ] **Migrate `src/tools/listSessions.ts`** — replace `client.get('/breath_sessions/list', ...)` with `grpcClient.listSessions(...)`; map `ListSessionsResponse` to the same output shape
- [ ] **Migrate `src/tools/getSession.ts`** — replace `client.get('/breath_sessions/${id}')` with `grpcClient.getSession({ id })`; map response
- [ ] **Migrate `src/tools/createSession.ts`** — replace `client.post('/breath_sessions', body)` with `grpcClient.createSession(request)`; map request fields to proto message
- [ ] **Migrate `src/tools/classifySession.ts`** — replace REST fetch with `grpcClient.getSession({ id })`; LLM formatting logic unchanged
- [ ] **Migrate `src/tools/classifyAll.ts`** — replace paginated REST fetch loop with `grpcClient.listSessions(...)` calls; batch logic unchanged
- [ ] **Migrate `src/tools/setTimeOfDay.ts`** — replace `client.patch('/breath_sessions/${id}', { timeOfDay })` with `grpcClient.updateSession({ id, timeOfDay })`

### 5.6 Cleanup

- [ ] **Delete `src/api/client.ts` and verify** — delete only after all 6 tools are migrated; confirm no remaining `MIND_API_URL` references with `grep -r "MIND_API_URL" src/`

---

## Completed

| Milestone | Date |
|-----------|------|
