# Plan: Update `src/tools/listSessions.ts` for cursor response shape

## Context
Align the `list_my_breath_sessions` MCP tool with the cursor pagination contract already implemented in `src/api/grpc-client.ts` and `src/types.ts`: drop the obsolete `page` input, map `result.items` (each `{ session, section }`), and surface `section` per output item.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Update the tool

- [x] **Task 1: Remove `page` from the input schema**
  Files: `src/tools/listSessions.ts`
  In `inputSchema`, delete the `page` field entirely. Keep only `pageSize`, e.g.
  `pageSize: z.number().optional().describe("Number of sessions per page (default 10)")`.
  Cursor is server-managed — the MCP tool always fetches the first page, so no cursor input is exposed either.

- [x] **Task 2: Update the handler signature and API call**
  Files: `src/tools/listSessions.ts`
  Change the handler input type from `{ page?: number; pageSize?: number }` to `{ pageSize?: number }`.
  Update the call to the API client. NOTE: the spec note shows `fetchSessions(input.pageSize)`, but the actual exported signature in `src/api/grpc-client.ts` is `fetchSessions(opts?: { cursor?: string; pageSize?: number })`. Call it as `fetchSessions({ pageSize: input.pageSize })` to match the real contract.

- [x] **Task 3: Map `result.items` into the compact output with `section`**
  Files: `src/tools/listSessions.ts`
  Replace the current `compact` object that exposes `total`/`page`/`pageSize`/`data`. The response from `fetchSessions` is `BreathSessionListResponse` (`{ items: SessionListItem[]; nextCursor?: string }`). Build:
  ```typescript
  const compact = {
    items: result.items.map(({ session, section }) => ({
      id: session.id,
      description: session.description,
      complexity: session.complexity,
      timeOfDay: session.timeOfDay,
      shared: session.shared,
      isStarred: session.isStarred,
      section,
    })),
  };
  ```
  Do NOT include `total`, `page`, `pageSize`, or `nextCursor` in the output. Keep the existing `catch` block returning `isError: true` unchanged.

- [x] **Task 4: Update the tool description to mention section grouping** (depends on Task 3)
  Files: `src/tools/listSessions.ts`
  Update `description` so Claude understands the section grouping, e.g.:
  `"Fetch a compact list of breathing sessions visible to the authenticated user, grouped by section: STARRED (starred by me), MINE (my own), SHARED (others' shared). Use get_breath_session for full details including exercises."`

### Phase 2: Verify

- [x] **Task 5: Type-check** (depends on Tasks 1-4)
  Files: `src/tools/listSessions.ts`
  Run `npx tsc --noEmit` from `mind_mcp/` and confirm no errors. Confirm the tool output for `list_my_breath_sessions` is `{ items: [...] }` where each item carries a `section` field and there is no `total`/`page`/`pageSize` in the output.

## Commit Plan
- **Commit 1** (after tasks 1-5): "Update list sessions tool for cursor response shape"
