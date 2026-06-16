# Plan Review 2 — Update fetchSessions in src/api/grpc-client.ts

**Plan:** `.ai-factory/plans/14-update-fetchsessions-in-src-api-grpc-client-ts.md`
**Risk Level:** 🟡 Medium

## Verification Against Codebase

Every concrete claim in the plan was checked against the source. All accurate:

- **Enum values** — `src/generated/breath_sessions.ts:109-114` confirms `SessionSection { STARRED = 0, MINE = 1, SHARED = 2, UNRECOGNIZED = -1 }`. The plan's switch labels and `default → "SHARED"` (covering `UNRECOGNIZED`) are correct. ✅
- **`SessionListItem.session` type** — `breath_sessions.ts:207-210` confirms `session: BreathSessionWithStarredDto | undefined`. `mapSessionWithStarred` (`grpc-client.ts:191`) takes exactly `BreathSessionWithStarredDto`, so `mapSessionWithStarred(item.session!)` type-checks and the non-null assertion is justified. ✅
- **Request shape** — `ListSessionsRequest` has `cursor?: string | undefined` and `pageSize: number` (`breath_sessions.ts:275-279`). `{ cursor: undefined, pageSize: pageSize ?? 10 }` is valid. ✅
- **Response shape** — `ListSessionsResponse` is `{ items: SessionListItem[]; nextCursor?: string | undefined }` (`breath_sessions.ts:281-285`), matching `resp.items` / `resp.nextCursor`. ✅
- **`src/types.ts` target shapes** — `SessionSection`, `SessionListItem`, and `{ items, nextCursor }` already exist (`types.ts:27-37`), so the new imports resolve. ✅
- **Import aliasing** — generated module exports both a value `SessionSection` (enum) and a value/type `SessionListItem`. `SessionSection as ProtoSessionSection` (value) and `type SessionListItem as ProtoSessionListItem` (type-only) are correct. ✅
- **Lint claim** — `eslint.config.js` extends `tseslint.configs.recommended`, which enables `@typescript-eslint/no-unused-vars` as error; `lint` runs `--fix`, `lint:check` does not (`package.json:34-35`). The plan's guidance to verify via `lint:check` (not `lint`) is correct and important. ✅
- **Caller inventory** — `fetchSessions` has exactly two callers, `src/tools/listSessions.ts:15` and `src/tools/classifyAll.ts:30,36`, both reading the old `data/total/page/pageSize` contract exactly as the plan describes. ✅
- **Architecture alignment** — change stays within `api/grpc-client.ts`, consistent with `ARCHITECTURE.md` dependency rules (`api → generated`, `api → types`). No boundary violation. ✅

## Context Gates

- **Architecture (`ARCHITECTURE.md`):** PASS — no boundary or dependency-rule violations.
- **Rules:** No `.ai-factory/RULES.md` present → WARN (optional file absent, non-blocking).
- **Roadmap (`ROADMAP.md`):** This milestone is line 47 of Phase 6. See the critical issue below regarding inconsistency with the planned downstream milestone (line 51).

## Critical Issue

### The dropped-cursor signature conflicts with the roadmap's planned `classifyAll` migration and that tool's core purpose

The plan deliberately reduces the signature to `fetchSessions(pageSize?: number)` and hardcodes `cursor: undefined`, justified as: *"MCP only ever needs the first page and must never follow the cursor."*

That premise is contradicted by an existing tool and by the roadmap:

- `classify_all_sessions` (`src/tools/classifyAll.ts`) exists specifically to fetch **all** sessions — `fetchAllSessions` currently walks every page (`fetchSessions(1, 50)` then loops to `totalPages`). Its whole purpose is full coverage, not the first page.
- `ROADMAP.md:51` plans the deferred `classifyAll` migration as **cursor iteration**: *"call `fetchSessions({ cursor: undefined })` for the first page, then loop calling `fetchSessions({ cursor: nextCursor })` until `nextCursor` is `undefined`."*

The signature this plan locks in (`pageSize` only, no cursor parameter) makes that planned milestone-51 approach **impossible without re-signing `fetchSessions` again**. Worse, if milestone 51 is instead forced to a single first-page fetch, `classify_all_sessions` would silently classify only one page and miss the rest — a functional regression against the tool's contract, with no error surfaced.

This is a cross-milestone architectural inconsistency, not merely deferred breakage. It should be resolved before this plan is implemented, because the chosen signature is the thing future work must build on. Options:

1. **Preserve cursor support in the signature** — e.g. `fetchSessions(opts?: { cursor?: string; pageSize?: number }): Promise<BreathSessionListResponse>`, passing `opts?.cursor` through. The response already returns `nextCursor`, so callers that only need the first page simply ignore it. This keeps milestone 51 viable as the roadmap describes and is the lowest-risk path.
2. **Keep the first-page-only signature but amend `ROADMAP.md:51`** to redesign `classifyAll` around a single bounded fetch — and verify the API enforces no server-side max `pageSize` that would truncate results, otherwise sessions are silently dropped.

Either is acceptable, but the plan currently asserts a design ("MCP only ever needs the first page") that is factually false for `classify_all_sessions` and incompatible with the documented next milestone. Pick one and make the plan and roadmap consistent.

## Minor Notes

- **`mapSection` default → `"SHARED"`** is a reasonable fallback, but note it diverges from the codebase's other unknown-value conventions (`mapTimeOfDay` → `null`, `mapStepType` → `"inhale"`). Since `SessionSection` has no neutral member this is acceptable; worth a one-line comment that `UNRECOGNIZED` is intentionally coerced to `SHARED` (least-privileged grouping).
- **Whole-project build will not compile after this milestone** (the two callers stay broken). The plan states this is intentional/lockstep, consistent with milestones 49/51. Acceptable, but be aware `npm run build` / `npm start` are broken until those land — the verification must rely on the *scoped* `tsc --noEmit` error-location check the plan already specifies.
- **`lint:check` runs `eslint src`**, which also lints `src/generated/*`. If generated output has pre-existing lint violations, `lint:check` may report errors outside `grpc-client.ts`. The plan's claim is correctly scoped ("must pass *for* `src/api/grpc-client.ts`"), so this is just an implementer heads-up, not a plan defect.

## Positive Notes

- Exceptionally precise: exact line ranges, the `no-unused-vars` lint trap (and the `lint` vs `lint:check` distinction) are correctly anticipated, and the enum-numeric-values guard was actually resolved rather than left as a TODO.
- Correctly identifies and intentionally defers both broken callers with accurate descriptions of *why* each breaks.
- Mapper placement and switch-pattern guidance match existing conventions in the file.

## Verdict

The plan is technically correct and implementable as written for its immediate scope, but the first-page-only signature decision creates a real conflict with `classify_all_sessions`' purpose and the roadmap's milestone-51 plan. Resolve the cursor-support question (Option 1 recommended) and align the plan/roadmap before implementing.
