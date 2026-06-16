# Plan: Update `BreathSessionListResponse` in `src/types.ts`

## Context
Replace the page-based `BreathSessionListResponse` shape with the cursor-based contract from mind_api (Phase 33), adding `SessionSection` and `SessionListItem` types. This is a types-only change; `grpc-client.ts` and `listSessions.ts` will fail to compile until later milestones — that is expected.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Update types

- [x] **Task 1: Replace `BreathSessionListResponse` and add cursor-contract types**
  Files: `src/types.ts`
  Remove all four fields (`data`, `total`, `page`, `pageSize`) from the existing `BreathSessionListResponse` interface. Add a new union type `SessionSection = 'STARRED' | 'MINE' | 'SHARED'` and a new interface `SessionListItem { session: BreathSession; section: SessionSection }`. Replace `BreathSessionListResponse` with `{ items: SessionListItem[]; nextCursor: string | undefined }`. Match the exact shapes in the spec note `.ai-factory/notes/03-types-cursor-contract.md`. Keep all other types (`TimeOfDay`, `BreathStep`, `BreathExercise`, `BreathSession`, `CreateBreathSessionPayload`) unchanged. `types.ts` must not import from anywhere else in the project (per ARCHITECTURE.md dependency rules).
  Note: `npx tsc --noEmit` will report errors in `grpc-client.ts` and `listSessions.ts` — this is expected and resolved in subsequent milestones. The new types in `types.ts` themselves compile cleanly.
