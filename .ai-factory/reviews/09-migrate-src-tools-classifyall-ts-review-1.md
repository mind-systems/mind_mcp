# Review: Migrate `src/tools/classifyAll.ts`

**Plan:** `.ai-factory/plans/09-migrate-src-tools-classifyall-ts.md`
**Scope:** single-line import swap in `src/tools/classifyAll.ts`

## Changes reviewed

| File | Change |
|------|--------|
| `src/tools/classifyAll.ts` | Import `fetchSessions` from `../api/grpc-client.js` instead of `../api/client.js` |
| `.ai-factory/plans/09-migrate-src-tools-classifyall-ts.md` | New plan file (no runtime impact) |

## Signature compatibility

- **REST** (`client.ts:29`): `fetchSessions(page?: number, pageSize?: number): Promise<BreathSessionListResponse>`
- **gRPC** (`grpc-client.ts:241`): `fetchSessions(page?: number, pageSize?: number): Promise<BreathSessionListResponse>`

Identical signatures and return type. The `fetchAllSessions()` pagination loop accesses `.data`, `.total`, and `.pageSize` — all present on `BreathSessionListResponse`.

## Runtime behavior

- **`timeOfDay` filtering** (line 54–56): The gRPC mapper `mapTimeOfDay` returns `null` for unset/unrecognized proto enum values. The existing filter `s.timeOfDay === null || s.timeOfDay === undefined` handles this correctly.
- **`isStarred` field**: The gRPC mapper adds an `isStarred` boolean that the REST client did not include. This field is unused by `classifyAll.ts` — no impact.
- **Pagination**: `fetchAllSessions()` calls `fetchSessions(1, 50)` then pages through remaining results. The gRPC `fetchSessions` defaults page/pageSize via `page ?? 1, pageSize ?? 10`, but explicit values are always passed here, so defaults are irrelevant.

## Checklist

- [x] Type signatures match between old and new import
- [x] Return shape (`BreathSessionListResponse`) unchanged
- [x] Pagination fields (`total`, `page`, `pageSize`, `data`) present on gRPC response
- [x] `timeOfDay` null/undefined filter still correct with gRPC mapper output
- [x] No other files affected by this change
- [x] No security concerns (auth token handling is in `grpc-client.ts`, unchanged)

## Issues found

None.

REVIEW_PASS
