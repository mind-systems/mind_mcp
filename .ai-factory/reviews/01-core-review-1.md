# Review: 01-core (round 1)

## Code Review Summary

**Files Reviewed:** 6 (package.json, tsconfig.json, src/types.ts, src/api/client.ts, src/tools/listSessions.ts, src/index.ts)
**Risk Level:** :green_circle: Low

### Context Gates

- **ARCHITECTURE.md** — WARN: none. Dependency rules followed correctly (`types.ts` has no project imports, tools import from `api/` and `types`, `api/client.ts` imports only from `types`, `index.ts` only imports tools). One-file-per-tool pattern respected.
- **RULES.md** — WARN: file does not exist, skipped.
- **ROADMAP.md** — WARN: milestone line references `MIND_JWT_TOKEN` but implementation correctly uses `MIND_PAT_TOKEN` per DESCRIPTION.md and CLAUDE.md. The roadmap text is stale but the code is correct.

### Critical Issues

None.

### Suggestions

#### 1. Broken lint/format scripts — `package.json:12-13`

`package.json` defines `lint` (eslint) and `format` (prettier) scripts, but neither `eslint` nor `prettier` is in `devDependencies`. Running `npm run lint` or `npm run format` will fail with "command not found".

**Fix:** Either install the packages (`npm i -D eslint prettier`) or remove the scripts until linting is in scope. Since the Core milestone doesn't include linting, removing the scripts is cleaner.

#### 2. `patchSession` exported but unused — `src/api/client.ts:36-44`

`src/api/client.ts` exports `patchSession()` which no tool in this milestone calls. This is dead code — it's preparation for the AI Classification milestone.

**Fix:** Remove `patchSession` and the unused `BreathSession` import (only `BreathSessionListResponse` is needed by `fetchSessions`). Re-add it when `set_session_time_of_day` is implemented.

#### 3. `isStarred` field missing from type — `src/types.ts:14-24`

The API's `GET /breath_sessions/list` returns `BreathSessionWithStarredDto[]` which includes an `isStarred: boolean` field. The `BreathSession` type in `types.ts` omits it. At runtime this is harmless — `JSON.stringify` serializes whatever the API returns regardless of TypeScript types, so the LLM will see `isStarred` in the output. The type is just slightly incomplete.

**Fix:** Add `isStarred?: boolean` to `BreathSession`, or create a separate `BreathSessionListItem` type that extends `BreathSession` with the field.

### Positive Notes

- Build (`tsc`) passes cleanly with zero errors.
- MCP SDK API usage is correct: the 4-argument `server.tool(name, description, rawShapeSchema, handler)` overload matches the installed SDK version.
- Top-level `await` in `index.ts` works correctly with `"type": "module"` + `"target": "ES2022"` + `"module": "NodeNext"`.
- Import paths all use `.js` extensions as required by NodeNext module resolution.
- Environment validation in `api/client.ts` runs at import time (fail-fast at startup, before transport connects).
- No `console.log` anywhere — stdout correctly reserved for MCP protocol; only `console.error` for startup message.
- `.gitignore` covers `dist/`, `node_modules/`, `.env` — no risk of committing build artifacts or secrets.
- Error handling in `listSessions.ts` follows the project convention (`isError: true`, no thrown errors).
