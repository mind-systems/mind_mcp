# Review: 01-core (round 1)

## Build & correctness

- `npm run build` passes cleanly with zero errors.
- MCP SDK API usage verified against installed SDK source (`@modelcontextprotocol/sdk@1.27.1`): the 4-argument `server.tool(name, description, rawShapeSchema, handler)` overload is correct; plain zod-shape objects are the intended input format.
- Top-level `await` in `index.ts` works correctly with `"type": "module"` + `"target": "ES2022"` + `"module": "NodeNext"`.
- Import paths all use `.js` extensions (required for NodeNext module resolution).
- Environment validation in `api/client.ts` runs at import time (fail-fast at startup, before transport connects) — correct behavior.
- No `console.log` anywhere (stdout reserved for MCP protocol); only `console.error` for startup message.
- `.gitignore` covers `dist/`, `node_modules/`, `.env` — no risk of committing build artifacts or secrets.

## Issues

### 1. Broken lint/format scripts (low)

`package.json` defines `lint` (eslint) and `format` (prettier) scripts, but neither `eslint` nor `prettier` is in `devDependencies`. Running `npm run lint` or `npm run format` will fail with "command not found".

**Fix:** Either install the packages (`npm i -D eslint prettier`) or remove the scripts until linting is in scope. Since the Core milestone doesn't include linting, removing the scripts is cleaner.

**File:** `package.json:12-13`

### 2. `patchSession` exported but unused (low)

`src/api/client.ts` exports `patchSession()` which no tool in this milestone calls. This is dead code — it's preparation for the AI Classification milestone.

**Fix:** Remove `patchSession` and the unused `BreathSession` import. Re-add it when `set_session_time_of_day` is implemented.

**File:** `src/api/client.ts:36-44`

### 3. `isStarred` field missing from type (info)

The API's `GET /breath_sessions/list` returns `BreathSessionWithStarredDto[]` which includes an `isStarred: boolean` field. The `BreathSession` type in `types.ts` omits it. At runtime this is harmless — `JSON.stringify` serializes whatever the API returns regardless of TypeScript types, so the LLM will see `isStarred` in the output. The type is just slightly incomplete.

**Fix (optional):** Add `isStarred?: boolean` to `BreathSession`, or create a separate `BreathSessionListItem` type that extends `BreathSession` with the field.

**File:** `src/types.ts:14-24`

## Summary

No critical or high-severity issues. The implementation follows the architecture guidelines, handles errors correctly, and builds cleanly. The three items above are all low/info severity.

REVIEW_PASS
