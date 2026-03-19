# Plan: Compact List & Detail Tool

## Context
Reduce payload size of `list_my_breath_sessions` by stripping heavy `exercises` data and other per-session fields, keeping only a compact summary (id, description, complexity, timeOfDay, shared). A new `get_breath_session` tool lets the AI fetch full details for a single session on demand. No API changes — all filtering happens in the MCP tool layer.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Compact list response

- [x] **Task 1: Strip fields from list response**
  Files: `src/tools/listSessions.ts`
  In the handler, after `fetchSessions()` returns the `BreathSessionListResponse`, map over `result.data` and pick only `{ id, description, complexity, timeOfDay, shared }` from each session before serialising to JSON. Keep the pagination envelope (`total`, `page`, `pageSize`) intact — only the per-session objects change. Use object destructuring to pick the five fields (no lodash/external utility). The handler signature and error handling pattern stay the same.

### Phase 2: Detail tool

- [x] **Task 2: Create `get_breath_session` tool**
  Files: `src/tools/getSession.ts`
  Create a new tool file following the exact pattern of existing tools (named export of `{ name, description, inputSchema, handler }`). Details:
  - Tool name: `get_breath_session`
  - Description: "Fetch full details of a single breathing session by ID, including exercises."
  - Input schema: `{ id: z.string().describe("ID of the breath session to retrieve") }` (required, no optional params)
  - Handler: call `fetchSession(id)` from `../api/client.js` (already exists), return the full `BreathSession` JSON-serialised as a `text` content block
  - Error handling: `try/catch` returning `{ isError: true, content: [{ type: "text", text }] }` — same as all other tools

- [x] **Task 3: Register new tool in entry point** (depends on Task 2)
  Files: `src/index.ts`
  Import `getSessionTool` from `./tools/getSession.js` and add it to the tool registration sequence alongside the existing five tools. Follow the same `server.tool(...)` call pattern.
