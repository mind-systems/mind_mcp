# Patch: 01-core (round 1)

**Review:** `.ai-factory/reviews/01-core-review-1.md`
**Scope:** 3 actionable items (1 review issue resolved by later milestone, 2 remaining + 1 context gate fix)

---

## Fix 1: Remove broken lint/format scripts

**File:** `package.json`
**Problem:** Lines 12–13 define `lint` (`eslint --fix src`) and `format` (`prettier --write src`) scripts, but neither `eslint` nor `prettier` is listed in `devDependencies`. Running either script fails at runtime.
**Severity:** Low
**Decision:** Remove the scripts. The Core milestone has `Linting: no` in settings. Re-add when linting tooling is properly set up.

### Exact change

```diff
--- a/package.json
+++ b/package.json
@@ -9,9 +9,7 @@
   "scripts": {
     "build": "tsc",
     "dev": "tsc --watch",
-    "start": "node dist/index.js",
-    "lint": "eslint --fix src",
-    "format": "prettier --write src"
+    "start": "node dist/index.js"
   },
```

---

## Fix 2: Add missing `isStarred` field to `BreathSession` type

**File:** `src/types.ts`
**Problem:** The API's `GET /breath_sessions/list` returns objects that include an `isStarred: boolean` field (from `BreathSessionWithStarredDto`). The `BreathSession` interface omits it. While harmless at runtime (JSON pass-through), this means any TypeScript code accessing `session.isStarred` would get a compile error, and the type doesn't accurately describe the API response shape.
**Severity:** Info

### Exact change

```diff
--- a/src/types.ts
+++ b/src/types.ts
@@ -18,6 +18,7 @@
   complexity: number;
   shared: boolean;
   timeOfDay: TimeOfDay | null;
+  isStarred?: boolean;
   createdAt: string;
   updatedAt: string;
 }
```

---

## Fix 3: Correct stale env var name in ROADMAP.md

**File:** `.ai-factory/ROADMAP.md`
**Problem:** Line 5 references `MIND_JWT_TOKEN` but the actual implementation (and all other documentation: DESCRIPTION.md, ARCHITECTURE.md, CLAUDE.md) uses `MIND_PAT_TOKEN`. This creates confusion for anyone reading the roadmap.
**Severity:** Low

### Exact change

```diff
--- a/.ai-factory/ROADMAP.md
+++ b/.ai-factory/ROADMAP.md
@@ -2,7 +2,7 @@

 ## Milestones

-- [x] **Core** — standalone TypeScript MCP package (`mind_mcp/`); stdio transport; env-based auth (`MIND_API_URL` + `MIND_JWT_TOKEN`); tool: `list_my_breath_sessions`
+- [x] **Core** — standalone TypeScript MCP package (`mind_mcp/`); stdio transport; env-based auth (`MIND_API_URL` + `MIND_PAT_TOKEN`); tool: `list_my_breath_sessions`
```

---

## Skipped: `patchSession` dead code

**Review issue:** #2 — `patchSession` exported but unused in Core milestone.
**Status:** Resolved. The AI Classification milestone (commit `ecd5406`) added `src/tools/setTimeOfDay.ts` which imports and uses `patchSession`. No action needed.
