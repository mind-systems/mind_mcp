# Review: Migrate `src/tools/getSession.ts`

Plan: `.ai-factory/plans/06-migrate-src-tools-getsession-ts.md`

## Changes reviewed

| File | Change |
|------|--------|
| `src/tools/getSession.ts` | Import swapped from `../api/client.js` to `../api/grpc-client.js` |
| `.ai-factory/plans/06-migrate-src-tools-getsession-ts.md` | New plan file (task marked complete) |

## Verification

- **Signature match:** `grpc-client.ts` exports `fetchSession(id: string): Promise<BreathSession>` — identical to the REST `client.ts` signature. The call site `fetchSession(input.id)` is compatible with no changes needed.
- **Return type:** `grpc-client.ts` maps the proto `BreathSessionWithStarredDto` through `mapSessionWithStarred`, returning the same `BreathSession` shape used by the handler's `JSON.stringify`.
- **Error handling:** `grpc-client.ts` rejects with `grpcError(err)` which produces a standard `Error`. The handler's `catch (err)` and string interpolation handles this the same as REST errors.
- **Build:** `tsc` compiles cleanly with no errors.
- **Pattern consistency:** Matches the already-migrated `listSessions.ts` (import-only swap).

## Issues

None found.

REVIEW_PASS
