# Update fetchSessions in grpc-client.ts to Cursor Contract

**Date:** 2026-06-04
**Source:** mind_api Phase 33 — cursor pagination contract (see `01-list-sessions-cursor-migration.md`)

## Key Findings

- `fetchSessions` (around line 241 in `src/api/grpc-client.ts`) currently calls `{ page, pageSize }` and maps `resp.data / resp.total / resp.page / resp.pageSize`.
- The new call passes `{ cursor: undefined, page_size: pageSize }` (MCP only needs the first page — never follow the cursor).
- A `mapSection` helper is needed to convert the proto enum (`ProtoSessionSection`) to the TS union (`SessionSection`).

## Details

### File changed

`src/api/grpc-client.ts`

### New imports (add to existing import block from generated stubs)

```typescript
import {
  // ... existing imports ...
  SessionSection as ProtoSessionSection,
  type SessionListItem as ProtoSessionListItem,
} from "../generated/breath_sessions.js";

import type { SessionListItem, SessionSection } from "../types.js";
```

### mapSection helper (add near fetchSessions)

```typescript
function mapSection(s: ProtoSessionSection): SessionSection {
  switch (s) {
    case ProtoSessionSection.STARRED: return 'STARRED';
    case ProtoSessionSection.MINE:    return 'MINE';
    case ProtoSessionSection.SHARED:  return 'SHARED';
    default:                          return 'SHARED';
  }
}
```

### Updated fetchSessions signature and body

```typescript
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

### How to verify

`npx tsc --noEmit` — will show errors in `listSessions.ts` only (fixed in next milestone). `fetchSessions` itself type-checks cleanly against the new `BreathSessionListResponse` shape.

## Open Questions

- `SessionSection` enum values in generated TS may be numeric (0/1/2) — check `src/generated/breath_sessions.ts` after regen and adjust the `switch` cases if needed (e.g. `case 0:` vs `case ProtoSessionSection.STARRED:`).
