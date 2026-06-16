# Plan Review: Update `src/tools/listSessions.ts` for cursor response shape

**Plan:** `15-update-src-tools-listsessions-ts-for-cursor-response-shape.md`
**Risk Level:** 🟢 Low

## Context Gates

- **Architecture (`ARCHITECTURE.md`)** — ✅ PASS. The change stays entirely within `src/tools/listSessions.ts`, a single tool file, and depends only on `fetchSessions` from `api/grpc-client.js` and types from `types.ts`. This matches the allowed dependency rules (`tools/* → api/grpc-client.ts`, `tools/* → types.ts`). No layer violations. Note: the `ARCHITECTURE.md` "Code Examples" section still shows the old `page`/`total`/`data` shape for `listSessions.ts` — not a blocker for this plan, but the architecture doc's example is now stale (WARN, doc maintenance only).
- **Rules (`RULES.md`)** — ✅ PASS (file is empty; no explicit conventions to enforce).
- **Roadmap (`ROADMAP.md`)** — ✅ PASS. The plan maps directly to the open Phase 6 milestone "Update `src/tools/listSessions.ts` for cursor response shape", including its verify criteria. Good linkage.

## Verification Against Codebase

I cross-checked every assumption in the plan against the actual source:

- **`fetchSessions` signature** — `grpc-client.ts:260` exports `fetchSessions(opts?: { cursor?: string; pageSize?: number }): Promise<BreathSessionListResponse>`. The plan (Task 2) explicitly flags the spec-note discrepancy (`fetchSessions(input.pageSize)`) and prescribes the correct call `fetchSessions({ pageSize: input.pageSize })`. ✅ Correct and a good catch.
- **Response shape** — `fetchSessions` returns `{ items, nextCursor }` (`grpc-client.ts:278`); `BreathSessionListResponse` is `{ items: SessionListItem[]; nextCursor: string | undefined }` (`types.ts:34`). The plan's `result.items.map(({ session, section }) => ...)` matches `SessionListItem { session, section }` exactly. ✅
- **Fields in compact output** — `BreathSession` (`types.ts:14`) has `id`, `description`, `complexity`, `timeOfDay`, `shared`, and optional `isStarred`. All fields the plan maps exist. ✅
- **`section` values** — `SessionSection = 'STARRED' | 'MINE' | 'SHARED'` (`types.ts:27`), consistent with the Task 4 description text. ✅
- **Current file state** — `listSessions.ts` currently matches the "before" state the plan describes (input has `page`, handler calls `fetchSessions(input.page, input.pageSize)`, maps `result.data`/`total`/`page`/`pageSize`). ✅ No drift.
- **Error handling** — Plan preserves the existing `catch` block returning `isError: true`. ✅ Aligns with architecture principle #3.

## Findings

### Critical Issues
None.

### Minor Notes (non-blocking)

1. **`isStarred` added to output is an undeclared scope addition (WARN).** The plan's Task 3 compact mapping adds `isStarred` to each item, but neither the milestone description nor the milestone's verify criteria mention `isStarred` — they only require adding `section`. This is a benign, type-safe enhancement (`isStarred` exists on `BreathSession`), but it is a silent scope expansion. Recommend either (a) keep it and note it explicitly, or (b) drop it to match the milestone scope precisely. Not a blocker.

2. **`isStarred` is optional and may be `undefined`.** `BreathSession.isStarred?` is optional. When absent, `JSON.stringify` will simply omit the key, which is acceptable for an LLM-facing compact view. No action required, just be aware the field will be inconsistent across items.

3. **Type-check command path.** Task 5 says run `npx tsc --noEmit` from `mind_mcp/`. Confirm a `tsc`/`typescript` is resolvable there (it is per `package.json` build scripts). Consider `npm run build` as an equivalent gate. Cosmetic.

## Positive Notes

- The plan correctly identifies and corrects the upstream spec-note error about the `fetchSessions` signature instead of propagating it — this is exactly the kind of cross-check that prevents a compile break.
- Scope is tightly bounded to one file; no migrations, no proto edits (correctly respects proto ownership rules), no security surface touched (PAT/transport untouched).
- Output intentionally excludes `nextCursor`/pagination metadata, consistent with the "first page only, server-managed cursor" decision already baked into `grpc-client.ts`.
- Verify phase has concrete, checkable acceptance criteria matching the roadmap milestone.

The plan is accurate, well-scoped, and ready to implement. The only suggestion is to make the `isStarred` addition an explicit, intentional decision.

PLAN_REVIEW_PASS
