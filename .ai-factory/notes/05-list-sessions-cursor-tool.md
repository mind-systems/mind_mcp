# Update listSessions Tool for Cursor Contract

**Date:** 2026-06-04
**Source:** mind_api Phase 33 — cursor pagination contract (see `01-list-sessions-cursor-migration.md`)

## Key Findings

- `src/tools/listSessions.ts` input schema currently includes a `page` field — cursor is server-managed; MCP always fetches the first page, so `page` is removed entirely.
- The handler currently maps `result.data` and discards sections — must map `result.items` and include `section` per item in the compact output.
- Tool `description` should mention section grouping so Claude knows how to interpret the response.

## Details

### File changed

`src/tools/listSessions.ts`

### Updated input schema

```typescript
const inputSchema = {
  pageSize: z.number().optional().describe("Number of sessions per page (default 10)"),
};
```

### Updated handler

```typescript
handler: async (input: { pageSize?: number }) => {
  try {
    const result = await fetchSessions(input.pageSize);
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
    return {
      content: [{ type: "text" as const, text: JSON.stringify(compact, null, 2) }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Failed to fetch sessions: ${err}` }],
    };
  }
},
```

### Updated tool description

```typescript
description:
  "Fetch a compact list of breathing sessions visible to the authenticated user, grouped by section: STARRED (starred by me), MINE (my own), SHARED (others' shared). Use get_breath_session for full details including exercises.",
```

### How to verify

`npx tsc --noEmit` passes with no errors. Run the MCP server against a dev API with Phase 33 deployed. Call `list_my_breath_sessions` — response contains `items[]` each with a `section` field (`STARRED`, `MINE`, or `SHARED`). No `total`, `page`, or `pageSize` in the output.
