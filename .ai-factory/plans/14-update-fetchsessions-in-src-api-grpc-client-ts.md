# Plan: Update fetchSessions in src/api/grpc-client.ts

## Context
Migrate `fetchSessions` in the gRPC client from the old page-based pagination contract to the new cursor-based contract, returning `{ items, nextCursor }` and mapping the proto `SessionSection` enum to the TS `SessionSection` union.

## Design decision: signature keeps cursor support
This milestone's source note describes the call site as "first page only, never follow cursor". That is true for the **first-page caller** (`listSessions`), but the signature must still expose a `cursor` because the next milestone (`ROADMAP.md:51`, migrate `classifyAll`) is documented to iterate pages by calling `fetchSessions({ cursor: undefined })` then `fetchSessions({ cursor: nextCursor })` until `nextCursor` is `undefined`. A `pageSize`-only signature would make that planned milestone impossible without re-signing the function, and a forced first-page-only `classifyAll` would silently classify only one page (a regression against `classify_all_sessions`' full-coverage contract).

Therefore the signature is an **options object** — `fetchSessions(opts?: { cursor?: string; pageSize?: number })` — passing `opts?.cursor` straight through. First-page callers simply omit `cursor` (and ignore `nextCursor` in the response). This satisfies this milestone's usage and keeps milestone 51 viable as the roadmap describes, with no roadmap amendment needed.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Cursor migration

- [x] **Task 1: Update generated-stub imports**
  Files: `src/api/grpc-client.ts`
  In the import block from `../generated/breath_sessions.js` (lines 4–17), add `SessionSection as ProtoSessionSection` (value import — it is a real TS enum, not just a type) and `type SessionListItem as ProtoSessionListItem`. The existing imports of `ListSessionsRequest`/`ListSessionsResponse` stay. In the import block from `../types.js` (lines 18–25), add `SessionListItem` and `SessionSection`. `BreathSessionListResponse` is already imported and now resolves to the new `{ items, nextCursor }` shape defined in `src/types.ts`.

- [x] **Task 2: Add mapSection helper** (depends on Task 1)
  Files: `src/api/grpc-client.ts`
  Add a private helper near the other DTO mappers (e.g. after `mapSessionWithStarred`, before the exported functions). Follow the existing `mapTimeOfDay`/`mapStepType` switch pattern:
  ```typescript
  function mapSection(s: ProtoSessionSection): SessionSection {
    switch (s) {
      case ProtoSessionSection.STARRED:
        return "STARRED";
      case ProtoSessionSection.MINE:
        return "MINE";
      case ProtoSessionSection.SHARED:
        return "SHARED";
      // UNRECOGNIZED (and any future member) is intentionally coerced to the
      // least-privileged grouping; SessionSection has no neutral member.
      default:
        return "SHARED";
    }
  }
  ```
  Note: confirmed the generated enum is named with numeric values (`STARRED = 0`, `MINE = 1`, `SHARED = 2`, `UNRECOGNIZED = -1`), so `ProtoSessionSection.*` case labels are correct — no need to fall back to numeric literals. The `default → "SHARED"` deliberately diverges from `mapTimeOfDay → null` / `mapStepType → "inhale"` because there is no neutral section; the inline comment documents this.

- [x] **Task 3: Rewrite fetchSessions to cursor contract** (depends on Task 2)
  Files: `src/api/grpc-client.ts`
  Replace the current `fetchSessions` (lines 241–258):
  - Replace the `(page?, pageSize?)` parameters with a single options object — signature becomes `fetchSessions(opts?: { cursor?: string; pageSize?: number }): Promise<BreathSessionListResponse>` (see "Design decision" above for why `cursor` is exposed).
  - Build the request as `{ cursor: opts?.cursor, pageSize: opts?.pageSize ?? 10 }`. First-page callers pass no `cursor` (so it is `undefined`); page-walking callers (milestone 51) pass `opts.cursor`.
  - Map `resp.items` to `SessionListItem[]`, annotating both ends so the `ProtoSessionListItem` and `SessionListItem` imports from Task 1 are genuinely referenced (avoids the `@typescript-eslint/no-unused-vars` lint error — see Notes):
    ```typescript
    const items: SessionListItem[] = resp.items.map(
      (item: ProtoSessionListItem) => ({
        session: mapSessionWithStarred(item.session!),
        section: mapSection(item.section),
      }),
    );
    return { items, nextCursor: resp.nextCursor };
    ```
    `mapSessionWithStarred` already throws on a missing `session`, but the proto `item.session` is optional, so the `!` is intentional and consistent with existing usage.
  - Remove all references to the old `resp.data / resp.total / resp.page / resp.pageSize`.

## Notes
- This change touches only `src/api/grpc-client.ts`. **Two callers** still use the old contract and will not type-check after this milestone — both are intentionally deferred to later milestones (`ROADMAP.md:49` and `:51`), so leave them broken and do **not** touch them here:
  - `src/tools/listSessions.ts` — calls `fetchSessions(input.page, input.pageSize)` and reads `result.data/total/page/pageSize`.
  - `src/tools/classifyAll.ts` — calls `fetchSessions(1, 50)` (positional args, no longer valid against the options-object signature) and reads `firstPage.total/pageSize/data` and `result.data`.
- Whole-project build (`npm run build` / `npm start`) will not compile until those two milestones land — this lockstep breakage is expected. Verification must rely on the **scoped** error-location check below, not a clean full build.
- Lint guard: Task 1 adds `ProtoSessionListItem` and `SessionListItem` imports. These are only used if Task 3 annotates the map callback and result (as shown). The ESLint config enables `@typescript-eslint/no-unused-vars` as an error, so unused imports would fail `npm run lint:check` (and `npm run lint`, which runs `--fix`, would silently strip them). `tsconfig.json` does not set `noUnusedLocals`, so `tsc` alone would not catch this.
- Verify:
  - `npx tsc --noEmit` — `fetchSessions` and `mapSection` must type-check cleanly against the new `BreathSessionListResponse`; the **only** remaining errors should be confined to `src/tools/listSessions.ts` and `src/tools/classifyAll.ts`.
  - `npm run lint:check` — `src/api/grpc-client.ts` must report no errors (no unused-import errors). Note `lint:check` runs `eslint src`, which also lints `src/generated/*`; any findings there are pre-existing and out of scope — only `grpc-client.ts` must be clean.
