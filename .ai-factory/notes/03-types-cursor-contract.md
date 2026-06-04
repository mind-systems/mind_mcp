# Update BreathSessionListResponse Types for Cursor Contract

**Date:** 2026-06-04
**Source:** mind_api Phase 33 — cursor pagination contract (see `01-list-sessions-cursor-migration.md`)

## Key Findings

- `src/types.ts` currently defines `BreathSessionListResponse` with `data: BreathSession[]; total: number; page: number; pageSize: number` — all four fields are removed by the new API contract.
- Two new types are needed: `SessionSection` (union type) and `SessionListItem` (wraps a session with its section).
- `BreathSessionListResponse` becomes `{ items: SessionListItem[]; nextCursor: string | undefined }`.

## Details

### File changed

`src/types.ts`

### Before / after

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

### How to verify

`npx tsc --noEmit` — will show errors in `grpc-client.ts` and `listSessions.ts` (expected; those are fixed in subsequent milestones). The types themselves compile cleanly.
