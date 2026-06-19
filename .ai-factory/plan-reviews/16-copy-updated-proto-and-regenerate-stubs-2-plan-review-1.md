# Plan Review: Copy updated proto and regenerate stubs 2

**Plan:** `16-copy-updated-proto-and-regenerate-stubs-2.md`
**Files Reviewed:** 5 (plan, mcp proto, api proto, gen_proto.sh, generated stub + consumers)
**Risk Level:** 🟢 Low

## Verification Against Codebase

Every factual claim in the plan was checked against the actual files:

- ✅ **Source of truth is correct.** `mind_api/proto/breath_sessions.proto` has already dropped the `ReplaceSessionRequest` message and the `rpc ReplaceSession(...)` line. The `mind_mcp` copy is the stale one — confirmed the plan's direction (api → mcp) is right.
- ✅ **Line references are accurate.** In `mind_mcp/proto/breath_sessions.proto` the `ReplaceSessionRequest` message is at lines 111–120 and the `rpc ReplaceSession(...)` is at line 200, exactly as stated.
- ✅ **The two protos are otherwise identical.** A side-by-side comparison shows the *only* difference is the removed `ReplaceSession` RPC + message. Copying the api file verbatim is the correct, minimal action.
- ✅ **`setTimeOfDay` is unaffected.** `src/api/grpc-client.ts:298` uses `client.updateSession` (PATCH). No consumer calls `replaceSession` — confirmed via grep.
- ✅ **`replaceSession`/`ReplaceSessionRequest` references are confined to the generated stub** (`src/generated/breath_sessions.ts`). Nothing in `src/tools/*` or `src/api/*` references them, so regeneration alone removes all traces — Task 3's grep will pass.
- ✅ **Tooling exists.** `package.json` defines `proto:gen` → `bash scripts/gen_proto.sh`, and the script regenerates into `src/generated/`. The `npx tsc --noEmit` verify step matches the `build` script (`tsc`).
- ✅ **Workflow compliance.** Plan honors the proto-ownership rule in `CLAUDE.md` (copy, never symlink, never hand-edit) and the "do not edit generated files" rule in `ARCHITECTURE.md`.

## Context Gates

- **Architecture (`ARCHITECTURE.md`):** WARN-free. `generated/` is explicitly "do not edit"; the plan regenerates rather than hand-edits — aligned. No dependency-boundary impact.
- **Rules (`RULES.md`):** Not present — no rule violations to assess.
- **Roadmap (`ROADMAP.md`):** Not checked as blocking. This is a pure contract-sync chore (no `feat`/`fix`/`perf` surface), so roadmap linkage is not expected. WARN: optional.
- **Skill context (`.ai-factory/skill-context/aif-review/SKILL.md`):** Not present — no project-specific overrides apply.

## Observations (non-blocking)

- **WARN — regen touches all stubs, not just `breath_sessions.ts`.** `gen_proto.sh` runs `protoc ... proto/*.proto`, so it regenerates every stub (e.g. `auth.ts`). If the other `.proto` files are unchanged the output should be byte-identical, but `ts-proto` version drift can produce incidental diffs. Suggestion for the implementer: after Task 2, run `git status src/generated/` and confirm only `breath_sessions.ts` changed; if other stubs change unexpectedly, that signals a toolchain drift to investigate rather than commit blindly. This doesn't change the plan, just the verification expectation.
- **Minor — no `npm run lint`/`build` step.** Task 3's `npx tsc --noEmit` covers type safety, which is sufficient for a generated-only change. The generated file is excluded from lint concerns anyway. No action needed.

## Positive Notes

- Tight, correctly-scoped plan: it explicitly forbids hand-editing the generated output and touching consumers, which is exactly right for a proto-sync.
- Built-in self-checks (the post-copy grep, the post-regen absence checks, the type-check) make the plan verifiable and hard to get subtly wrong.
- Correctly identifies that `setTimeOfDay` rides on `updateSession` and is untouched — avoids a spurious consumer edit.

The plan is solid, factually accurate against the codebase, and follows project conventions. The single WARN is an implementer verification note, not a defect in the plan.

PLAN_REVIEW_PASS
