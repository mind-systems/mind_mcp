# Plan: Session Creation Tool

## Context

Add a `create_breath_session` MCP tool that lets an AI agent design a complete breathing exercise program based on a user's natural-language request (goal, difficulty, time of day) and persist it via the existing `POST /breath_sessions` API endpoint. The tool accepts the fully structured session payload — exercise design is the LLM's responsibility; the tool handles validation and API submission.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: API client and types

- [x] **Task 1: Add `CreateBreathSessionPayload` type to `types.ts`**
  Files: `src/types.ts`
  Add a new interface `CreateBreathSessionPayload` that matches the API's `CreateBreathSessionDto`:
  ```
  {
    description: string;
    exercises: BreathExercise[];
    shared?: boolean;
    timeOfDay?: TimeOfDay;
  }
  ```
  Reuse the existing `BreathExercise` and `TimeOfDay` types already defined in the file.

- [x] **Task 2: Add `createSession` function to the API client**
  Files: `src/api/client.ts`
  Add a new exported async function following the existing pattern (`fetchSessions`, `fetchSession`, `patchSession`):
  ```typescript
  export async function createSession(
    data: CreateBreathSessionPayload,
  ): Promise<BreathSession> {
    return request<BreathSession>("/breath_sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  ```
  Import `CreateBreathSessionPayload` from `../types.js`.

### Phase 2: Tool implementation

- [x] **Task 3: Create `createSession.ts` tool file**
  Files: `src/tools/createSession.ts`
  Create a new tool file following the exact pattern of existing tools (e.g., `classifySession.ts`, `setTimeOfDay.ts`). Export a `createSessionTool` object with `{ name, description, inputSchema, handler }`.

  **Tool name:** `create_breath_session`

  **Description:** Write a rich description that guides the LLM on how to design breathing exercises. Include:
  - The tool creates a new breathing session via the Mind API
  - The AI agent should design exercises based on the user's goal, desired difficulty, and time of day
  - Explain the exercise structure: each exercise has `steps` (array of inhale/exhale/hold with duration in ms), `restDuration` (ms between repeats), and `repeatCount`
  - Mention typical duration ranges (e.g., step durations usually 1000-10000ms, rest 1000-5000ms, repeatCount 1-10)
  - Explain that `complexity` is computed server-side and should not be provided

  **Input schema (Zod):**
  - `description` — `z.string()` — descriptive name/summary of the session
  - `exercises` — `z.array(z.object({ steps: z.array(z.object({ type: z.enum(["inhale", "exhale", "hold"]), duration: z.number().min(0).describe("Duration in milliseconds") })).min(1), restDuration: z.number().min(0).describe("Rest between repeats in milliseconds"), repeatCount: z.number().min(1).describe("Number of times to repeat this exercise") })).min(1)` — at least one exercise with at least one step
  - `timeOfDay` — `z.enum(["morning", "midday", "evening"]).optional()` — when this session is best suited for
  - `shared` — `z.boolean().optional()` — whether to make the session publicly visible (default false)

  **Handler:** Call `createSession(input)` from `api/client.ts`. On success, return JSON-stringified created `BreathSession` as MCP text content (same pattern as `setTimeOfDay`). On error, catch and return `{ isError: true, content: [...] }`.

- [x] **Task 4: Register the tool in `index.ts`**
  Files: `src/index.ts`
  Import `createSessionTool` from `./tools/createSession.js` and register it with `server.tool()` following the same pattern as the other four tools. Add the import alongside the existing tool imports and the registration block after the existing registrations.

### Phase 3: Build verification

- [x] **Task 5: Verify TypeScript compilation**
  Files: (none — build check)
  Run `npm run build` to confirm the project compiles without errors. Fix any type mismatches or import issues if they arise. Run `npm run lint` to ensure code style is consistent.
