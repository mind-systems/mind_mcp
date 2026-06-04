# Copy Updated Proto and Regenerate Stubs

**Date:** 2026-06-04
**Source:** mind_api Phase 33 — cursor pagination contract (see `01-list-sessions-cursor-migration.md`)

## Key Findings

- `mind_api/proto/breath_sessions.proto` has a breaking change: `ListSessionsRequest` replaces `page: int32` with `cursor: optional string`; `ListSessionsResponse` replaces `data/total/page/page_size` with `items: repeated SessionListItem` and `next_cursor: optional string`.
- `mind_mcp/proto/breath_sessions.proto` must be an exact copy of `mind_api/proto/breath_sessions.proto` — never edited in place.
- Regenerating stubs updates `src/generated/breath_sessions.ts`; no manual edits to generated files.

## Details

### Files changed

- `proto/breath_sessions.proto` — overwrite with contents from `mind_api/proto/breath_sessions.proto`
- `src/generated/breath_sessions.ts` — regenerated output; commit as-is

### Steps

1. Copy `mind_api/proto/breath_sessions.proto` verbatim into `mind_mcp/proto/breath_sessions.proto`.
2. Run `npm run proto:gen` (verify script name in `package.json` first).
3. Commit both files together.

### New proto contract shape

```proto
enum SessionSection { STARRED = 0; MINE = 1; SHARED = 2; }

message SessionListItem {
  BreathSessionWithStarredDto session = 1;
  SessionSection section = 2;
}

message ListSessionsRequest {
  optional string cursor = 1;
  int32 page_size = 2;
}

message ListSessionsResponse {
  repeated SessionListItem items = 1;
  optional string next_cursor = 2;
}
```

### How to verify

`npm run proto:gen` exits 0. `src/generated/breath_sessions.ts` contains `SessionSection`, `SessionListItem`, `ListSessionsRequest.cursor`, `ListSessionsResponse.items`.

## Open Questions

- Confirm the proto gen script name in `package.json` (`proto:gen` vs `gen`).
- Check whether `SessionSection` enum values in the generated TS are numeric (0/1/2) or string names — affects `mapSection` in the next milestone.
