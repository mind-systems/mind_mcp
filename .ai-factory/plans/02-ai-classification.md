# Plan: AI Classification

## Context

Add three MCP tools that let Claude classify breathing sessions by time of day. `classify_session_time_of_day` returns session data formatted for the LLM to suggest a `timeOfDay` value, `set_session_time_of_day` PATCHes the chosen value via the API, and `classify_all_sessions` presents all unclassified sessions in one batch for review and confirmation.

## Settings
- Testing: no
- Logging: minimal (stderr only)
- Docs: no

## Tasks

### Phase 1: API client

- [x] **Task 1: Add single-session fetch to the API client**
  Files: `src/api/client.ts`
  Add a `fetchSession(id: string)` function that calls `GET /breath_sessions/:id` and returns a single `BreathSession`. Follow the same pattern as `fetchSessions` and `patchSession` — use the private `request<T>` helper, same error handling. This is needed by `classify_session_time_of_day` and `classify_all_sessions` to retrieve full session data by ID.

### Phase 2: Tool implementations

- [x] **Task 2: Create the classify_session_time_of_day tool** (depends on Task 1)
  Files: `src/tools/classifySession.ts`
  Create a new tool file following the exact pattern from `listSessions.ts` (export a plain object with `name`, `description`, `inputSchema`, `handler`).
  - **name:** `"classify_session_time_of_day"`
  - **inputSchema:** `{ sessionId: z.string() }` (required)
  - **handler:** Call `fetchSession(sessionId)` to get the full session. Format the response as a structured text block that includes: session description, exercise breakdown (steps with types and durations, rest duration, repeat count), and a clear instruction asking the LLM to analyse the session characteristics and return one of `morning`, `midday`, or `evening` as the suggested `timeOfDay`. Wrap in the standard MCP `content` array. On error, return `isError: true` with the error message.

- [x] **Task 3: Create the set_session_time_of_day tool**
  Files: `src/tools/setTimeOfDay.ts`
  Create a new tool file following the `listSessions.ts` pattern.
  - **name:** `"set_session_time_of_day"`
  - **inputSchema:** `{ sessionId: z.string(), timeOfDay: z.enum(["morning", "midday", "evening"]) }` (both required)
  - **handler:** Call `patchSession(sessionId, { timeOfDay })` (already exists in `api/client.ts`). Return the updated session as pretty-printed JSON in the MCP `content` array. On error, return `isError: true` with the error message.

- [x] **Task 4: Create the classify_all_sessions tool** (depends on Task 1)
  Files: `src/tools/classifyAll.ts`
  Create a new tool file following the `listSessions.ts` pattern.
  - **name:** `"classify_all_sessions"`
  - **inputSchema:** `{}` (no required input)
  - **handler:** Call `fetchSessions()` to retrieve all sessions (paginate through all pages if `total > pageSize`). Filter to only sessions where `timeOfDay` is `null`. If none are unclassified, return a message saying so. Otherwise, format each unclassified session the same way as Task 2 (description + exercise breakdown). Return the full batch as a single MCP text response, with a clear instruction asking the LLM to classify each session and present the suggestions to the user for confirmation before calling `set_session_time_of_day` for each.

### Phase 3: Registration

- [x] **Task 5: Register all new tools in the entry point** (depends on Tasks 2-4)
  Files: `src/index.ts`
  Import `classifySessionTool` from `./tools/classifySession.js`, `setTimeOfDayTool` from `./tools/setTimeOfDay.js`, and `classifyAllTool` from `./tools/classifyAll.js`. Register each with `server.tool()` using the same four-argument call pattern as `listSessionsTool` (`name`, `description`, `inputSchema`, `handler`).

## Commit Plan
- **Commit 1** (after tasks 1-3): "Add classify and set-time-of-day tools with API client support"
- **Commit 2** (after tasks 4-5): "Add batch classification tool and register all new tools"
