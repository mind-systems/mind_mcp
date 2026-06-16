# Plan Review: Update fetchSessions in src/api/grpc-client.ts (review 3)

**Plan:** `.ai-factory/plans/14-update-fetchsessions-in-src-api-grpc-client-ts.md`
**Risk Level:** 🟢 Low

## Verification Summary

Every concrete assumption in the plan was checked against the actual codebase. All hold:

| Plan claim | Verified |
|---|---|
| `fetchSessions` lives at lines 241–258 with `(page?, pageSize?)` + `resp.data/total/page/pageSize` | ✅ exact match (`grpc-client.ts:241-258`) |
| Import block from `../generated/breath_sessions.js` at lines 4–17; `../types.js` at 18–25 | ✅ exact match |
| `SessionSection` is a real numeric enum `STARRED=0, MINE=1, SHARED=2, UNRECOGNIZED=-1` | ✅ `breath_sessions.ts:109-114` |
| Generated `SessionListItem.session` is optional (`BreathSessionWithStarredDto \| undefined`), `section: SessionSection` | ✅ `breath_sessions.ts:207-210` — justifies the `item.session!` assertion |
| `ListSessionsRequest = { cursor?: string; pageSize: number }` | ✅ `breath_sessions.ts:275-279` |
| `ListSessionsResponse = { items: SessionListItem[]; nextCursor?: string }` | ✅ `breath_sessions.ts:281-285` |
| `types.ts` `BreathSessionListResponse` already migrated to `{ items, nextCursor }` + `SessionListItem`/`SessionSection` | ✅ `types.ts:27-37` (milestone 13 landed) |
| `mapSessionWithStarred` exists and throws on missing `session` | ✅ `grpc-client.ts:191-199` |
| Two deferred callers break as described | ✅ `listSessions.ts:15` (`fetchSessions(input.page, input.pageSize)`, reads `.data/.total/.page/.pageSize`); `classifyAll.ts:30,33,36` (`fetchSessions(1, 50)`, reads `.data/.total/.pageSize`) |
| ESLint `recommended` enables `no-unused-vars` as error; `tsconfig` has no `noUnusedLocals` | ✅ `eslint.config.js` extends `tseslint.configs.recommended`; `tsconfig.json` has no `noUnusedLocals` — the lint guard reasoning is accurate |
| `lint:check` = `eslint src`, `lint` = `eslint src --fix` | ✅ `package.json` scripts |
| `.js` import extension convention | ✅ correct for `module: NodeNext` ESM resolution; consistent with existing imports |

## Context Gates

- **Architecture:** No boundary violation. Change is confined to the API client layer (`src/api/`), preserving the existing DTO-mapper pattern. Adding `mapSection` alongside `mapTimeOfDay`/`mapStepType` is consistent with established structure.
- **Rules:** All-English content ✅. Proto-contract ownership respected — the plan only reads generated stubs, does not touch `.proto` files. No convention violations.
- **Roadmap:** Milestone is `ROADMAP.md:47`. The plan's deferral of `listSessions.ts` (`:49`) and `classifyAll.ts` (`:51`) matches the roadmap's lockstep sequencing. **WARN (non-blocking, well-reasoned):** see below.

## Findings

### WARN — Intentional deviation from milestone-47 literal wording (no action needed)
`ROADMAP.md:47` literally says "remove `page` param; call with `{ cursor: undefined, pageSize }` (first page only, never follow cursor)". The plan instead keeps a `cursor` parameter via an options-object signature `fetchSessions(opts?: { cursor?: string; pageSize?: number })`.

This deviation is **correct and well-justified**:
- `ROADMAP.md:51` (the very next milestone) explicitly specifies `classifyAll` calling `fetchSessions({ cursor: undefined })` then `fetchSessions({ cursor: nextCursor })` in a loop. That presupposes exactly the options-object-with-cursor signature this plan introduces.
- A strict first-page-only signature would force a re-signing of `fetchSessions` one milestone later, or would silently cap `classify_all_sessions` at one page (a regression).
- The plan documents this reconciliation explicitly in its "Design decision" section and correctly concludes no roadmap amendment is required.

No change requested — flagging only so the deviation is a conscious, recorded choice rather than an oversight.

### Confirmed-correct details worth noting
- `mapSection` `default → "SHARED"` for `UNRECOGNIZED`/future members: deliberately diverges from the `null`/`"inhale"` defaults of sibling mappers because `SessionSection` has no neutral member. The inline comment documents the rationale. Acceptable.
- The lint-guard reasoning is materially important and accurate: without annotating both the map callback param (`ProtoSessionListItem`) and the result (`SessionListItem`), the Task-1 imports would be unused — and `npm run lint` (`--fix`) would silently strip them while `tsc` stays green. The plan's instruction to verify with `lint:check` (non-fixing) is the right call.
- `item.session!` non-null assertion is sound: generated type is optional, and `mapSessionWithStarred` already guards/throws on a missing session.

## Critical Issues
None.

## Positive Notes
- Exceptionally precise: line numbers, import positions, and enum values were all stated and all verified accurate.
- Correctly anticipates and embraces the expected cross-milestone compile breakage rather than masking it; verification strategy (scoped `tsc --noEmit` error-location check + `lint:check` on `grpc-client.ts`) is appropriate given the lockstep design.
- The design-decision section resolves a genuine tension between two roadmap milestones with sound forward-compatibility reasoning.

The plan is complete, technically accurate, and ready to implement.

PLAN_REVIEW_PASS
