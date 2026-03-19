# Plan: Core

## Context

Bootstrap the `mind_mcp/` package from scratch — a standalone TypeScript MCP server that connects via stdio, authenticates against the Mind API using a PAT token from the environment, and exposes a single `list_my_breath_sessions` tool.

> **Note:** The roadmap milestone references `MIND_JWT_TOKEN`, but all project documentation (DESCRIPTION.md, ARCHITECTURE.md, CLAUDE.md) specifies `MIND_PAT_TOKEN`. This plan follows the established project convention (`MIND_PAT_TOKEN`).

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Project scaffolding

- [x] **Task 1: Create package.json and tsconfig.json**
  Files: `package.json`, `tsconfig.json`
  Create `package.json` with:
  - `name`: `mind-mcp`, `version`: `1.0.0`, `type`: `module`
  - `scripts`: `build` (`tsc`), `dev` (`tsc --watch`), `start` (`node dist/index.js`)
  - Dependencies: `@modelcontextprotocol/sdk`, `zod`
  - DevDependencies: `typescript`, `@types/node`
  - `engines`: `{ "node": ">=18.0.0" }` (native `fetch` requirement)

  Create `tsconfig.json` targeting ES2022/NodeNext with:
  - `outDir`: `dist`, `rootDir`: `src`, `strict`: true
  - `module`: `NodeNext`, `moduleResolution`: `NodeNext`
  - `include`: `["src"]`

  Run `npm install` to generate `node_modules/` and `package-lock.json`.

### Phase 2: Core implementation

- [x] **Task 2: Create shared types** (depends on Task 1)
  Files: `src/types.ts`
  Define types matching the Mind API response contract:
  - `TimeOfDay` enum: `morning`, `midday`, `evening`
  - `BreathStep` interface: `type` (`inhale` | `exhale` | `hold`), `duration` (number, ms)
  - `BreathExercise` interface: `steps` (BreathStep[]), `restDuration` (number), `repeatCount` (number)
  - `BreathSession` interface: `id` (string), `userId` (string), `description` (string), `exercises` (BreathExercise[]), `complexity` (number), `shared` (boolean), `timeOfDay` (TimeOfDay | null), `createdAt` (string), `updatedAt` (string)
  - `BreathSessionListResponse` interface: `data` (BreathSession[]), `total` (number), `page` (number), `pageSize` (number)

  `types.ts` must NOT import from anywhere else in the project (per ARCHITECTURE.md dependency rules).

- [x] **Task 3: Create API client** (depends on Task 2)
  Files: `src/api/client.ts`
  Follow the pattern from ARCHITECTURE.md code examples:
  - Read `MIND_API_URL` and `MIND_PAT_TOKEN` from `process.env` at module level; throw if missing.
  - Implement a generic `request<T>(path, options?)` function that injects `Authorization: Bearer ${TOKEN}` and `Content-Type: application/json` headers, checks `res.ok`, and throws on API errors with status + body text.
  - Export `fetchSessions(page?, pageSize?)` — calls `GET /breath_sessions/list` with optional query params, returns `BreathSessionListResponse`.
  - Never log the token; use `console.error()` for any debug output (stdout reserved for MCP protocol).

- [x] **Task 4: Create list_my_breath_sessions tool** (depends on Task 3)
  Files: `src/tools/listSessions.ts`
  Follow the tool definition pattern from ARCHITECTURE.md:
  - Export `listSessionsTool` object with `name`, `description`, `inputSchema` (zod), and `handler`.
  - Input schema: `page` (optional number), `pageSize` (optional number).
  - Handler calls `fetchSessions()` from `api/client.ts`, returns sessions as formatted JSON text in MCP content array.
  - Wrap handler body in try/catch — on error return `{ isError: true, content: [...] }` with the error message. Never throw out of the handler.

- [x] **Task 5: Create server entry point** (depends on Task 4)
  Files: `src/index.ts`
  Follow the registration pattern from ARCHITECTURE.md:
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js` and `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`.
  - Import `listSessionsTool` from `./tools/listSessions.js`.
  - Create server: `new McpServer({ name: "mind-mcp", version: "1.0.0" })`.
  - Register the tool using `server.tool(name, description, inputSchema, handler)`.
  - Create stdio transport, connect, and log startup to stderr.
  - Verify the package builds cleanly with `npm run build`.

## Commit Plan
- **Commit 1** (after tasks 1-3): "Initialize MCP package with shared types and API client"
- **Commit 2** (after tasks 4-5): "Add list_my_breath_sessions tool and server entry point"
