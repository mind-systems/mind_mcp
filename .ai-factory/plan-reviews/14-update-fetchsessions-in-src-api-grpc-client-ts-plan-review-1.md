# Plan Review: Update fetchSessions in src/api/grpc-client.ts

**Plan:** `.ai-factory/plans/14-update-fetchsessions-in-src-api-grpc-client-ts.md`
**Risk Level:** 🟡 Medium (core change is correct; one verification assumption is wrong)

## Verification Against Codebase

I verified every assumption in the plan against the actual source:

- **Import block line ranges** — generated imports at lines 4–17, `../types.js` imports at 18–25, `fetchSessions` at 241–258. ✅ All match `src/api/grpc-client.ts`.
- **`SessionSection` enum values** — `src/generated/breath_sessions.ts:109` confirms `STARRED = 0, MINE = 1, SHARED = 2, UNRECOGNIZED = -1`. The `ProtoSessionSection.*` case labels and the `default → "SHARED"` (covers `UNRECOGNIZED`) are correct. ✅
- **`SessionListItem` proto shape** — `src/generated/breath_sessions.ts:207` is `{ session: BreathSessionWithStarredDto | undefined; section: SessionSection }`. So `mapSessionWithStarred(item.session!)` is type-correct (the mapper takes `BreathSessionWithStarredDto` and the `!` is justified — `session` is optional in proto). ✅
- **`ListSessionsRequest`** — `cursor?: string | undefined; pageSize: number` (line 275). Building `{ cursor: undefined, pageSize: pageSize ?? 10 }` is correct. ✅
- **`ListSessionsResponse`** — `items: SessionListItem[]; nextCursor?: string | undefined` (line 281). ✅
- **Target `BreathSessionListResponse`** — `src/types.ts:34` is `{ items: SessionListItem[]; nextCursor: string | undefined }`, and `SessionListItem.session` is the mapped `BreathSession`. The return value `{ items, nextCursor: resp.nextCursor }` satisfies it. ✅
- **`mapSessionWithStarred` location** — lines 191–199, before the exported functions, matching the "after `mapSessionWithStarred`, before the exported functions" placement. ✅

The core migration (Tasks 1–3) is correct and implementable as written.

## Context Gates

- **Architecture** — WARN-none. Change stays within the existing DTO-mapper / exported-function structure of `grpc-client.ts`; no boundary or dependency-rule violation.
- **Rules** — No `.ai-factory/RULES.md` and no `skill-context/aif-review/SKILL.md` present (skill-context dir is empty). No project-specific overrides to apply.
- **Roadmap** — Aligned. This is Phase 6 milestone "Update `fetchSessions` in `src/api/grpc-client.ts`" (ROADMAP.md:47). The roadmap confirms the intended scope and the lockstep with later milestones.

## Critical Issues

### 1. Wrong assumption: verification note understates which files break

The plan's Notes/verify section states (lines 48–49):

> The caller `src/tools/listSessions.ts` still uses the old `result.data/total/page/pageSize` shape and will not type-check... remaining errors should be confined to `src/tools/listSessions.ts`.

This is **factually incorrect**. `src/tools/classifyAll.ts` also calls `fetchSessions` with the old contract:

- `classifyAll.ts:30` → `fetchSessions(1, 50)` — passes 2 args to the new 1-arg signature → TS error.
- `classifyAll.ts:33–37` → reads `firstPage.total`, `firstPage.pageSize`, `firstPage.data`, `result.data` — none exist on the new `{ items, nextCursor }` shape → multiple TS errors.

So after this change `npx tsc --noEmit` will report errors in **both** `listSessions.ts` and `classifyAll.ts`, not just `listSessions.ts`. The ROADMAP confirms `classifyAll.ts` is intentionally deferred to a separate later milestone (ROADMAP.md:51), so leaving it broken is correct — but the plan must say so. As written, the verification guidance will mislead the implementer/verifier into thinking the change went wrong, or tempt them to "fix" `classifyAll.ts` out of milestone scope.

**Fix:** Update the verify note to state that expected post-change errors are confined to `src/tools/listSessions.ts` **and** `src/tools/classifyAll.ts`, both fixed in later milestones.

## Minor Issues

### 2. Two prescribed imports are unused as the code is written (lint failure risk)

Task 1 instructs adding `type SessionListItem as ProtoSessionListItem` (from generated) and `SessionListItem` (from `../types.js`). In the Task 3 code as shown:

- The `resp.items.map(item => ...)` callback infers `item` from `resp.items: SessionListItem[]`, so `ProtoSessionListItem` is never referenced by name.
- The returned object literal is not annotated as `SessionListItem`; the function return type `BreathSessionListResponse` (already imported) references it only transitively.

`tsconfig.json` does **not** set `noUnusedLocals`, so `npx tsc --noEmit` (the plan's stated check) passes. However, the ESLint config extends `typescript-eslint/recommended`, which enables `@typescript-eslint/no-unused-vars` as an error — so `npm run lint:check` would flag both imports. (`npm run lint` runs `--fix` and would silently strip them.)

`SessionSection` (from types) and `ProtoSessionSection` are genuinely used in `mapSection`, so those are fine.

**Fix (pick one):** either drop the `ProtoSessionListItem` and `SessionListItem` imports, or actually use them — e.g. annotate the callback `(item: ProtoSessionListItem)` and the mapped result `const items: SessionListItem[] = ...`. The latter also documents intent. Add `npm run lint:check` (or `npm run lint`) to the verify step alongside `tsc --noEmit`.

## Positive Notes

- The enum-value guard was actually performed and is correct — the plan didn't blindly assume string enums.
- Line-number references are precise and all verified against the current file.
- The `item.session!` non-null assertion is correctly justified against both the proto optionality and the existing `mapSessionWithStarred` throw behavior.
- Scope discipline is good: correctly refrains from touching `listSessions.ts`, matching the lockstep migration in the roadmap.

## Verdict

Core tasks are correct, but Issue #1 is a wrong assumption about the codebase in the plan's own verification guidance and should be corrected before implementation. Not a PLAN_REVIEW_PASS.
