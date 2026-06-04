# `listSessions` Tool — Migrate to Cursor + Sections Contract

**Date:** 2026-06-04
**Source:** mind_api Phase 33 — mobile team request (see `mind_api/.ai-factory/notes/40-starred-own-sessions-cursor-pagination.md`)

## Key Findings

- `mind_api` is shipping a breaking proto change to `ListSessionsRequest` / `ListSessionsResponse` in `breath_sessions.proto`. The old offset fields (`page`, `total`, `page_size`) are gone; the new contract uses an opaque cursor and returns typed section tags per item.
- Three files in `mind_mcp` must change: `proto/breath_sessions.proto` (copy from mind_api), `src/api/grpc-client.ts` (`fetchSessions` function + `BreathSessionListResponse` type), `src/tools/listSessions.ts` (input schema, handler, output shape).
- MCP only needs the first page — no cursor loop. Pass `cursor: undefined` on the first call; ignore `nextCursor` in the response.

## Details

### What the new proto contract looks like

```proto
enum SessionSection { STARRED = 0; MINE = 1; SHARED = 2; }

message SessionListItem {
  BreathSessionWithStarredDto session = 1;
  SessionSection section = 2;
}

message ListSessionsRequest {
  optional string cursor = 1;   // replaces old `int32 page = 1`
  int32 page_size = 2;
}

message ListSessionsResponse {
  repeated SessionListItem items = 1;
  optional string next_cursor = 2;
  // removed: total, page, page_size, data
}
```

### Step 1 — Copy proto and regenerate

Copy `proto/breath_sessions.proto` verbatim from `mind_api/proto/breath_sessions.proto` into `mind_mcp/proto/breath_sessions.proto` (mind_api is the single source of truth — never edit the proto file here).

Run the proto gen script (check `package.json` — likely `npm run proto:gen` or `npm run gen`). This regenerates `src/generated/breath_sessions.ts`. Do not edit generated files by hand.

### Step 2 — Update `src/types.ts`

Replace `BreathSessionListResponse`:

```typescript
// Before
export interface BreathSessionListResponse {
  data: BreathSession[];
  total: number;
  page: number;
  pageSize: number;
}

// After
export type SessionSection = 'STARRED' | 'MINE' | 'SHARED';

export interface SessionListItem {
  session: BreathSession;
  section: SessionSection;
}

export interface BreathSessionListResponse {
  items: SessionListItem[];
  nextCursor: string | undefined;
}
```

### Step 3 — Update `src/api/grpc-client.ts`

`fetchSessions` (line 241) currently calls with `{ page, pageSize }` and maps `resp.data` / `resp.total` / `resp.page` / `resp.pageSize`. Replace:

```typescript
// New import from generated types (after proto regen)
import {
  // ... existing imports ...
  SessionSection as ProtoSessionSection,
  type SessionListItem as ProtoSessionListItem,
} from "../generated/breath_sessions.js";

// New type in types.ts (see Step 2)
import type { SessionListItem, ... } from "../types.js";

function mapSection(s: ProtoSessionSection): SessionSection {
  switch (s) {
    case ProtoSessionSection.STARRED: return 'STARRED';
    case ProtoSessionSection.MINE: return 'MINE';
    case ProtoSessionSection.SHARED: return 'SHARED';
    default: return 'SHARED';
  }
}

export async function fetchSessions(
  pageSize?: number,
): Promise<BreathSessionListResponse> {
  const resp = await callUnary(
    client.listSessions as unknown as GrpcMethod<
      ListSessionsRequest,
      ListSessionsResponse
    >,
    { cursor: undefined, pageSize: pageSize ?? 10 },
  );
  return {
    items: resp.items.map((item: ProtoSessionListItem) => ({
      session: mapSessionWithStarred(item.session!),
      section: mapSection(item.section),
    })),
    nextCursor: resp.nextCursor,
  };
}
```

### Step 4 — Update `src/tools/listSessions.ts`

Input schema: remove `page` (cursor is server-managed; MCP only fetches first page). Keep `pageSize` optional.

```typescript
const inputSchema = {
  pageSize: z.number().optional().describe("Number of sessions per page (default 10)"),
};

export const listSessionsTool = {
  name: "list_my_breath_sessions",
  description:
    "Fetch a compact list of breathing sessions visible to the authenticated user, grouped by section: STARRED (starred by me), MINE (my own), SHARED (others' shared). Use get_breath_session for full details including exercises.",
  inputSchema,
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
};
```

### How to verify

`npx tsc --noEmit` passes with no errors. Run the MCP server locally against a dev API instance that has Phase 33 deployed. Call `list_my_breath_sessions` — response contains `items[]` each with `section` (`STARRED`/`MINE`/`SHARED`). No `total`, `page`, or `pageSize` in the output.

## Open Questions

- Proto gen script name: check `mind_mcp/package.json` `scripts` section before running.
- `SessionSection` enum values in the generated TS may be numeric (0/1/2) rather than string names — verify after regen and adjust `mapSection` if needed.
