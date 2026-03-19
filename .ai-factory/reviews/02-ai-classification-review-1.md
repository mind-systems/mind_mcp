# Review: AI Classification (02)

**Plan:** `.ai-factory/plans/02-ai-classification.md`
**Scope:** 6 files changed/added — `src/api/client.ts`, `src/index.ts`, `src/tools/classifySession.ts`, `src/tools/setTimeOfDay.ts`, `src/tools/classifyAll.ts`, `.ai-factory/plans/02-ai-classification.md`

## Build

`npm run build` (tsc) passes with no errors.

## Findings

### 1. Unused import — `classifyAll.ts:1`

**Severity:** Minor (lint)

`import { z } from "zod"` is declared but never used. The `inputSchema` is a plain empty object `{}` with no Zod types. This will fail strict `no-unused-vars` / `@typescript-eslint/no-unused-imports` lint rules.

**Fix:** Remove the `z` import.

### 2. Empty `inputSchema` ambiguity — `classifyAll.ts:5`

**Severity:** Low (no runtime impact)

`const inputSchema = {}` is passed to `server.tool(name, description, inputSchema, handler)`. The SDK overload for the third argument accepts `Args | ToolAnnotations`. An empty object `{}` is valid as either an empty Zod shape or an empty `ToolAnnotations`. TypeScript resolves this (build passes) and the handler ignores its first argument, so no runtime breakage. But it is fragile — a future SDK version could change overload resolution.

**Recommendation:** Could use the two-argument form `server.tool(name, description, handler)` for zero-argument tools to be explicit, or keep as-is since it matches the current pattern and works.

### 3. Duplicated formatting logic — `classifySession.ts` / `classifyAll.ts`

**Severity:** Observation (not a bug)

Both files have nearly identical exercise-formatting code (iterating exercises/steps, building text lines). The ARCHITECTURE.md says "no shared state between tools" and "don't add a services layer", so duplicating a pure formatting function is acceptable. If the format diverges later it's easy to maintain independently.

No action needed — this is a design trade-off, not a defect.

### 4. All other checks — pass

| Check | Result |
|-------|--------|
| `fetchSession` endpoint exists (`GET /breath_sessions/:id`) | Yes — controller line 124 |
| `patchSession` sends correct field (`timeOfDay`) | Yes — matches `UpdateBreathSessionDto` |
| `timeOfDay` enum values match API (`morning`, `midday`, `evening`) | Yes — matches `TimeOfDay` enum |
| Error handling: all tool handlers catch and return `isError: true` | Yes |
| No `console.log` (stdout reserved for MCP protocol) | Correct — none added |
| Types in sync with `types.ts` | Yes |
| Tool registration in `index.ts` matches tool exports | Yes — all four args match |
| Pagination logic in `fetchAllSessions` | Correct — handles single/multi page and empty results |
| No secrets logged or leaked | Correct |

## Verdict

One minor lint issue (unused `z` import). No bugs, no security issues, no type mismatches, no missing endpoints.

REVIEW_PASS
