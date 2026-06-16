# Plan Review: Copy updated proto and regenerate stubs

**Plan:** `.ai-factory/plans/12-copy-updated-proto-and-regenerate-stubs.md`
**Files Reviewed:** plan + 7 codebase files (both `breath_sessions.proto`, `gen_proto.sh`, `package.json`, `grpc-client.ts`, `listSessions.ts`, `classifyAll.ts`, `types.ts`, `ROADMAP.md`, `ARCHITECTURE.md`)
**Risk Level:** 🟢 Low

## Verdict

The plan is correct, executable, and faithful to the upstream contract. Every concrete claim checks out against the codebase. The findings below are advisory (non-blocking) clarifications — none of them change what the implementer must do or would cause a wrong result.

## Verification performed

- **Verbatim proto copy is accurate.** Diffed `mind_api/proto/breath_sessions.proto` (source of truth) against the local `mind_mcp/proto/breath_sessions.proto`. The four described changes are real and complete: new `SessionSection` enum (`STARRED=0/MINE=1/SHARED=2`), new `SessionListItem` message, `ListSessionsRequest` `int32 page = 1` → `optional string cursor = 1`, and `ListSessionsResponse` `data/total/page/page_size` → `repeated SessionListItem items = 1` + `optional string next_cursor = 2`. No other drift exists between the two files, so a full-file overwrite is the correct operation.
- **`proto:gen` script confirmed.** `package.json` → `"proto:gen": "bash scripts/gen_proto.sh"`; the script runs `protoc` with `protoc-gen-ts_proto` over `proto/*.proto` into `src/generated/`. Paths in Task 2 (`src/generated/breath_sessions.ts`) are correct.
- **File paths and git scope correct.** `proto/breath_sessions.proto` and `src/generated/breath_sessions.ts` both exist; git ops run inside `mind_mcp/` (current branch `grcp`). Committing both files together is the right call.
- **Architecture gate (WARN-free).** `ARCHITECTURE.md` marks `generated/*` as "do not edit" — consistent with the plan's "do not hand-edit the generated output."
- **Rules gate.** No `.ai-factory/RULES.md` and no `aif-review` skill-context present — nothing to enforce beyond defaults.
- **Roadmap gate (aligned).** This plan is Phase 6 milestone 1 of 4 in `ROADMAP.md`. The roadmap explicitly sequences the consumer-side fixes (`types.ts`, `grpc-client.ts`, `listSessions.ts`) into milestones 2–4 and even states the intermediate "breaks compilation until subsequent milestones are done." The plan's "No hand-written TypeScript changes in this milestone" is therefore intentional and correct, not an omission.

## Context Gates

- **Architecture:** OK — no boundary/dependency violations. (`generated/*` edit prohibition respected.)
- **Rules:** OK — no `RULES.md` present (WARN: optional file absent, expected).
- **Roadmap:** OK — milestone maps directly to Phase 6 task 1; follow-up work is explicitly tracked.

## Advisory (non-blocking)

1. **The repo will not compile after this commit — make that explicit in the plan.**
   Regenerating the stub removes `ListSessionsResponse.{data,total,page,pageSize}` and `ListSessionsRequest.page`, which are referenced by `src/api/grpc-client.ts` (lines 250–256), `src/tools/listSessions.ts` (17–20), and `src/tools/classifyAll.ts` (30–37). `npm run build` / `tsc` will fail until Phase 6 milestones 2–4 land. This is *intended* per the roadmap, and the plan correctly avoids running `tsc` — but the plan body never says so. Since `CLAUDE.md` lists `npm run build` as a standard command, an implementer may run it, see errors, and "helpfully" edit generated or consumer files — violating the milestone's no-TS-changes rule. Recommend adding one line to Task 2/Task 3, e.g.: *"Expected: `tsc` will not compile after this commit (consumer code still uses the old list shape); do NOT fix it here — milestones 2–4 handle it. Verify only that `npm run proto:gen` exits 0."*

2. **Scope the "no longer references removed fields" check to the response.** Task 2 asks to confirm the generated file no longer references `data/total/page`. Note that `pageSize` / `page_size` legitimately *remains* in `ListSessionsRequest` (`int32 page_size = 2`). A naive grep for `page` will still hit `pageSize`. Phrase the check as: the *response* drops `data/total/page/pageSize` and gains `items/nextCursor`, and the *request* drops singular `page` in favor of `cursor` (keeping `pageSize`).

3. **`SessionSection` will be a numeric enum.** The plan's forward-note to check numeric-vs-string for `mapSection` is good. Confirmed: `gen_proto.sh` sets no `stringEnums` option, so ts-proto emits numeric enum members (0/1/2). The next milestone's `mapSection` switch should key on numeric values.

4. **"Tag reuse, confirmed safe" is safe only under lockstep deploy.** The `page`(int32, varint) → `cursor`(string, length-delimited) swap reuses tag 1 across *different wire types*. This is safe here because mind_api and mind_mcp regenerate and deploy together and no serialized list messages are persisted — exactly what the proto comment ("lockstep, confirmed safe") asserts. No action needed; flagged only so the assumption is on record.

## Positive Notes

- Correctly treats `mind_api/proto/` as the single source of truth and forbids local proto edits — matches `CLAUDE.md` proto-ownership policy.
- Atomic commit of proto + regenerated stub prevents snapshot/output drift.
- Forward-looking note about the `SessionSection` enum representation de-risks the next milestone.
- Settings (no tests / minimal logging / no docs) are appropriate for a pure codegen-sync milestone.

PLAN_REVIEW_PASS
