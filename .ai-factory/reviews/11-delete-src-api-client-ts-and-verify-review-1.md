# Code Review: 11 — Delete `src/api/client.ts` and verify

## Scope

All staged changes on branch `grcp`: deletion of `src/api/client.ts`, config/doc updates across 9 files.

## Verification

- [x] `src/api/client.ts` deleted — confirmed absent from working tree
- [x] No `api/client.js` imports remain in `src/` — grep clean
- [x] `npm run build` succeeds with no errors
- [x] No `MIND_API_URL` references remain in `src/`, `.env.example`, `CLAUDE.md`, `package.json`, `README.md`, `docs/configuration.md`, `docs/getting-started.md`, `ARCHITECTURE.md`, or `DESCRIPTION.md`
- [x] No `client.ts` references remain in non-historical files (plans/reviews/roadmap references are expected — they describe past work)
- [x] `grpc-client.ts` comment updated from "same signatures as client.ts" to clean header
- [x] `ROADMAP.md` step 5.6 marked `[x]`, completed table entry added
- [x] `dist/` is gitignored — stale `dist/api/client.js` from prior builds won't be committed

## File-by-file review

### `src/api/client.ts` (deleted)
Correct. File was orphaned — no imports pointed to it.

### `src/api/grpc-client.ts`
Single-line change: comment `// ---- Exported functions (same signatures as client.ts) ----` → `// ---- Exported functions ----`. Correct, no functional change.

### `.env.example`
REST block and "shared by both clients" comment removed. Only gRPC + auth vars remain. Clean.

### `.ai-factory/ARCHITECTURE.md`
Thorough cleanup:
- Overview (line 7): "for HTTP" removed — now protocol-agnostic. Good.
- Decision Rationale (lines 11-12): "HTTP client wrapper" → "gRPC client wrapper", "native `fetch`" → "`@grpc/grpc-js`". Correct.
- Folder structure: `client.ts` entry removed, `grpc-client.ts` comment simplified. Correct.
- Cleanup note deleted. Correct.
- Dependency rules: all `client.ts` rules removed. Correct.
- ASCII tree: simplified to single `grpc-client.ts` path. Correct.
- Allow/deny rules: `client.ts` lines removed. Correct.
- Layer communication: updated to `grpc-client.ts` with gRPC description. Correct.
- Key principles: all five updated accurately. Correct.
- Code examples: import updated, REST client code example replaced with prose description. Correct.
- Anti-patterns: updated. Correct.

### `.ai-factory/DESCRIPTION.md`
- "HTTP Client" bullet removed from tech stack. Correct.
- "for future gRPC" → "for gRPC". Correct.
- `MIND_API_URL` bullet removed from authentication. Correct.
- Transition period paragraph removed. Correct.
- "shared by both clients" removed from PAT description. Correct.

### `.ai-factory/ROADMAP.md`
- Step 5.6 checkbox `[ ]` → `[x]`. Correct.
- Completed table entry added with date 2026-03-25. Correct.

### `README.md`
All three `claude mcp add` blocks updated:
- Prod: `MIND_GRPC_URL=grpc.mind-awake.life:443`, `MIND_GRPC_TLS=true`. Correct.
- Dev: `MIND_GRPC_URL=dev-grpc.mind-awake.life:443`, `MIND_GRPC_TLS=true`. Correct.
- Local: `MIND_GRPC_URL=localhost:50051`, `MIND_GRPC_TLS=false`. Correct.
- Russian language preserved throughout. Correct.

### `docs/configuration.md`
- `MIND_API_URL` row replaced with `MIND_GRPC_URL` and `MIND_GRPC_TLS` rows. Correct.
- Description text updated: `api/client.ts` → `api/grpc-client.ts`, "Обе переменные" → updated to name the two required vars. Correct.
- Russian language preserved. Correct.

### `docs/getting-started.md`
Same pattern as README — all three blocks updated with correct gRPC URLs and TLS flags. Russian preserved. Correct.

## Issues

None found. All changes are documentation/config-only (no runtime logic changes beyond the comment fix in `grpc-client.ts`). The deletion is safe — grep confirms no remaining imports. Build passes clean.

## Minor note (non-blocking)

`dist/api/client.js` and its `.d.ts`/`.map` files remain as stale build artifacts from prior compilations. Since `dist/` is gitignored this has no effect on the repo, but a `rm -rf dist && npm run build` would clean them up locally.

REVIEW_PASS
