# Architecture: Layered Architecture

## Overview

The Mind MCP Server uses a simple layered architecture. The server is a thin integration layer — it adapts the Mind API into MCP tools. There is no complex business logic, no database, and no domain model to enforce. Layered architecture provides just enough structure to keep the code organized and readable without adding unnecessary abstraction overhead.

Each MCP tool is a thin slice through the layers: it receives a call from the MCP client, delegates to the API client, and returns a formatted result.

## Decision Rationale

- **Project type:** MCP integration server (thin gRPC client wrapper)
- **Tech stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk`, `@grpc/grpc-js`
- **Key factor:** No domain logic — all "logic" lives in the Mind API. The MCP server only adapts and routes.
- **Team:** Solo developer

## Folder Structure

```
src/
├── index.ts           # Entry point — creates McpServer, registers tools, connects transport
├── tools/             # MCP tool definitions (one file per tool)
│   └── <toolName>.ts  # Each tool exports { name, description, inputSchema, handler }
├── api/               # API clients for Mind API
│   ├── grpc-client.ts  # gRPC client — exports fetchSessions, fetchSession, patchSession, createSession
│   └── grpc-error.ts   # gRPC status code → Error mapper
├── generated/         # ts-proto generated stubs (do not edit)
└── types.ts           # Shared TypeScript types
```

**Where to put new code:**
- New MCP tool → `src/tools/<toolName>.ts`, then register in `index.ts`
- New API endpoint call → add function to `src/api/grpc-client.ts`
- New shared type → `src/types.ts`

## Dependency Rules

- `index.ts` → `tools/*` (imports tool definitions to register them)
- `tools/*` → `api/grpc-client.ts` (calls API client to fetch/update data)
- `tools/*` → `types.ts` (uses shared types)
- `api/grpc-client.ts` → `api/grpc-error.ts` (error mapping)
- `api/grpc-client.ts` → `generated/*` (uses ts-proto stubs)
- `api/grpc-client.ts` → `types.ts` (uses shared types)

```
index.ts
  └── tools/*
        └── api/grpc-client.ts
              └── api/grpc-error.ts
              └── generated/*
        └── types.ts
```

- ✅ `tools` may import from `api/` and `types`
- ✅ `api/grpc-client.ts` may import from `api/grpc-error.ts`, `generated/*`, and `types`
- ❌ `api/grpc-client.ts` must NOT import from `tools/`
- ❌ `index.ts` must NOT call gRPC directly — go through `api/`
- ❌ `types.ts` must NOT import from anywhere else in the project

## Layer Communication

- **MCP client → `index.ts`**: via MCP stdio protocol
- **`index.ts` → tools**: direct function/object import at startup (tool registration)
- **tools → `api/grpc-client.ts`**: direct function call (async/await)
- **`api/grpc-client.ts` → Mind API**: gRPC calls with Bearer token from env

## Key Principles

1. **One file per tool** — each tool in `src/tools/` exports a single tool definition object. No shared state between tools.
2. **API client is the only API boundary** — all gRPC calls live in `src/api/grpc-client.ts`. Tools never call gRPC directly.
3. **Errors never throw past tools** — all errors from `api/grpc-client.ts` are caught in the tool and returned as MCP error results (`isError: true`).
4. **stdout is reserved for MCP protocol** — never `console.log()` to stdout. Use `console.error()` for debugging (goes to stderr).
5. **Config from env only** — `MIND_GRPC_URL`, `MIND_GRPC_TLS`, and `MIND_PAT_TOKEN` are read once at startup in `api/grpc-client.ts`. Never hardcoded, never logged.

## Code Examples

### Tool definition (src/tools/listSessions.ts)

```typescript
import { z } from "zod";
import { fetchSessions } from "../api/grpc-client.js";

export const listSessionsTool = {
  name: "list_my_breath_sessions",
  description: "Fetch a compact list of the authenticated user's breathing sessions (id, description, complexity, timeOfDay, shared). Use get_breath_session for full details including exercises.",
  inputSchema: {
    page: z.number().optional().describe("Page number (1-based)"),
    pageSize: z.number().optional().describe("Number of sessions per page"),
  },
  handler: async (input: { page?: number; pageSize?: number }) => {
    try {
      const result = await fetchSessions(input.page, input.pageSize);
      const compact = {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        data: result.data.map(({ id, description, complexity, timeOfDay, shared }) => ({
          id, description, complexity, timeOfDay, shared,
        })),
      };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(compact, null, 2) }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: `Failed to fetch sessions: ${err}` }],
      };
    }
  },
};
```

### API client (src/api/grpc-client.ts)

The gRPC client reads `MIND_GRPC_URL`, `MIND_GRPC_TLS`, and `MIND_PAT_TOKEN` from the environment at startup. It injects the PAT as a Bearer token via `grpc.credentials.createFromMetadataGenerator()` combined with channel credentials — authentication is automatic on every call, no per-call Metadata needed.

It exports the same four functions used by all tools: `fetchSessions`, `fetchSession`, `patchSession`, `createSession`.

### Tool registration (src/index.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listSessionsTool } from "./tools/listSessions.js";
import { classifySessionTool } from "./tools/classifySession.js";
import { setTimeOfDayTool } from "./tools/setTimeOfDay.js";
import { classifyAllTool } from "./tools/classifyAll.js";
import { createSessionTool } from "./tools/createSession.js";
import { getSessionTool } from "./tools/getSession.js";

const server = new McpServer({ name: "mind-mcp", version: "1.0.0" });

server.tool(
  listSessionsTool.name,
  listSessionsTool.description,
  listSessionsTool.inputSchema,
  listSessionsTool.handler,
);
// ... same pattern for classifySessionTool, setTimeOfDayTool, classifyAllTool,
//     createSessionTool, getSessionTool

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("mind-mcp server started");
```

## Anti-Patterns

- ❌ Don't add a `services/` layer — there is no business logic to put there
- ❌ Don't call gRPC inside a tool file — always go through `api/grpc-client.ts`
- ❌ Don't use `console.log()` — it corrupts the MCP stdio stream; use `console.error()` only
- ❌ Don't share mutable state between tool handlers — each call must be stateless
- ❌ Don't throw errors out of a tool handler — catch and return `isError: true` result
