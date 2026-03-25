# Plan: Delete `src/api/client.ts` and verify

## Context
All 6 tools have been migrated to `grpc-client.ts`. The legacy REST client (`src/api/client.ts`) is orphaned — nothing in `src/` imports it. This milestone removes the file and cleans up all references to it and to `MIND_API_URL` across the project.

## Settings
- Testing: no
- Logging: minimal
- Docs: yes (user-facing docs reference the deleted env var)

## Tasks

### Phase 1: Delete and verify

- [x] **Task 1: Delete `src/api/client.ts` and verify clean removal**
  Files: `src/api/client.ts`
  Delete `src/api/client.ts`. Then verify:
  1. `grep -r "MIND_API_URL" src/` returns no results.
  2. `npm run build` succeeds with no import errors.
  Both checks must pass before proceeding.

### Phase 2: Update project configuration

- [x] **Task 2: Remove REST block from `.env.example`** (depends on Task 1)
  Files: `.env.example`
  Remove the REST client section (lines 1-2: the comment and `MIND_API_URL=...`). Remove the "shared by both clients" comment — only one client remains. Result should contain only gRPC and auth vars:
  ```
  # gRPC client
  MIND_GRPC_URL=localhost:50051
  MIND_GRPC_TLS=false

  # Auth
  MIND_PAT_TOKEN=pat_your_token_here
  ```

- [x] **Task 3: Remove stale `client.ts` comment in `grpc-client.ts`** (depends on Task 1)
  Files: `src/api/grpc-client.ts`
  Line 239 has the comment `// ---- Exported functions (same signatures as client.ts) ----`. Change it to `// ---- Exported functions ----` since `client.ts` no longer exists.

### Phase 3: Update architecture and project description

- [x] **Task 4: Update `ARCHITECTURE.md` — remove all REST/client.ts references** (depends on Task 1)
  Files: `.ai-factory/ARCHITECTURE.md`
  Follow the embedded cleanup note at line 36: *"remove it from the folder structure above, remove the REST dependency rules below, and simplify the env docs."* Specifically:
  - **Overview** (line 7): change "delegates to the API client for HTTP" → "delegates to the API client for gRPC" (or just "delegates to the API client").
  - **Decision Rationale** (lines 11-12): change "thin HTTP client wrapper" → "thin gRPC client wrapper"; replace "native `fetch`" with "`@grpc/grpc-js`" in the tech stack bullet.
  - **Folder structure** (lines 23-24): remove `client.ts` entry, update `grpc-client.ts` comment to drop "(new, same 4 exported functions as client.ts)".
  - **"Where to put new code"** (line 33): remove `or src/api/client.ts (REST, legacy)` option.
  - **Delete the cleanup note** (line 36): the `> Note: api/client.ts will be deleted...` line — it's done.
  - **Dependency rules** (lines 41-65): remove `client.ts` → `types.ts` rule, remove `client.ts` from the `tools/*` rule (keep only `grpc-client.ts`), remove `client.ts` lines from the ASCII tree, remove the `client.ts` allow/deny rules.
  - **Layer Communication** (lines 71-72): remove `tools → api/client.ts` and `api/client.ts → Mind API` entries. Add `tools → api/grpc-client.ts` and `api/grpc-client.ts → Mind API` entries describing gRPC communication.
  - **Key Principles** (lines 77-80): principle 2 — change "HTTP boundary" / "`fetch()` calls live in `client.ts`" to "API boundary" / "gRPC calls live in `grpc-client.ts`". Principle 3 — change "`client.ts`" to "`grpc-client.ts`". Principle 5 — replace `MIND_API_URL` with `MIND_GRPC_URL`, change "`api/client.ts`" to "`api/grpc-client.ts`", add `MIND_GRPC_TLS`.
  - **Code examples** (lines 84-176): update the tool example import from `../api/client.js` to `../api/grpc-client.js`. Replace the entire "API client (src/api/client.ts)" code example section with a short `grpc-client.ts` usage note (no need to duplicate the full file — it's long and already in the repo). Keep the tool registration example unchanged.
  - **Anti-Patterns** (line 211): change "`api/client.ts`" to "`api/grpc-client.ts`" in the fetch anti-pattern.

- [x] **Task 5: Update `DESCRIPTION.md` — remove REST env var and transition note** (depends on Task 1)
  Files: `.ai-factory/DESCRIPTION.md`
  - In the Authentication section (lines 30-37): remove the `MIND_API_URL` bullet (line 30). Remove the transition period paragraph (lines 37). Keep `MIND_GRPC_URL`, `MIND_GRPC_TLS`, and `MIND_PAT_TOKEN`.
  - In the Tech Stack section: remove the `**HTTP Client:** Native fetch (no heavy libraries)` bullet if present — the server no longer uses fetch.

### Phase 4: Update user-facing docs

- [x] **Task 6: Update `README.md`, `docs/configuration.md`, `docs/getting-started.md` — replace `MIND_API_URL` with gRPC env vars** (depends on Task 1)
  Files: `README.md`, `docs/configuration.md`, `docs/getting-started.md`
  These docs are written in Russian — keep the language as-is.
  - **`README.md`**: in all three `claude mcp add` command blocks, replace `-e MIND_API_URL=...` with `-e MIND_GRPC_URL=...` (use the appropriate gRPC URLs: `grpc.mind-awake.life:443` for prod, `dev-grpc.mind-awake.life:443` for dev, `localhost:50051` for local). Add `-e MIND_GRPC_TLS=true` for prod/dev blocks (TLS enabled for remote servers). Remove the TLS flag for the local block or set it to `false`.
  - **`docs/configuration.md`**: replace the `MIND_API_URL` row in the env table with `MIND_GRPC_URL` and add a `MIND_GRPC_TLS` row. Update the description text below the table: change "`api/client.ts`" to "`api/grpc-client.ts`".
  - **`docs/getting-started.md`**: same replacement as README — update all `claude mcp add` command blocks to use `MIND_GRPC_URL` and `MIND_GRPC_TLS` instead of `MIND_API_URL`.

  **Note:** The exact gRPC hostnames for prod/dev may need to be confirmed with the API team. Use the pattern `grpc.mind-awake.life:443` / `dev-grpc.mind-awake.life:443` as placeholders if the actual addresses are not known.

### Phase 5: Mark roadmap complete

- [x] **Task 7: Mark ROADMAP.md step 5.6 as complete** (depends on Task 6)
  Files: `.ai-factory/ROADMAP.md`
  Change line 35 from `- [ ] **Delete \`src/api/client.ts\` and verify**` to `- [x] **Delete \`src/api/client.ts\` and verify**`. Add an entry to the "Completed" table at the bottom: `| 5.6 Delete src/api/client.ts and verify | <today's date> |`.

## Commit Plan
- **Commit 1** (after tasks 1-3): "Delete legacy REST client and clean up internal references"
- **Commit 2** (after tasks 4-6): "Update architecture docs and user-facing docs for gRPC-only setup"
- **Commit 3** (after task 7): "Mark roadmap step 5.6 as complete"
