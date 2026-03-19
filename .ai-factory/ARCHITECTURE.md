# Architecture: Layered Architecture

## Overview

The Mind MCP Server uses a simple layered architecture. The server is a thin integration layer — it adapts the Mind API into MCP tools. There is no complex business logic, no database, and no domain model to enforce. Layered architecture provides just enough structure to keep the code organized and readable without adding unnecessary abstraction overhead.

Each MCP tool is a thin slice through the layers: it receives a call from the MCP client, delegates to the API client for HTTP, and returns a formatted result.

## Decision Rationale

- **Project type:** MCP integration server (thin HTTP client wrapper)
- **Tech stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk`, native `fetch`
- **Key factor:** No domain logic — all "logic" lives in the Mind API. The MCP server only adapts and routes.
- **Team:** Solo developer

## Folder Structure

```
src/
├── index.ts           # Entry point — creates McpServer, registers tools, connects transport
├── tools/             # MCP tool definitions (one file per tool)
│   ├── listSessions.ts
│   ├── classifySession.ts
│   ├── setTimeOfDay.ts
│   └── classifyAll.ts
├── api/               # HTTP client for Mind API
│   └── client.ts      # All fetch() calls, auth header injection
└── types.ts           # Shared TypeScript types (BreathSession, TimeOfDay, etc.)
```

## Dependency Rules

- `index.ts` → `tools/*` (imports tool definitions to register them)
- `tools/*` → `api/client.ts` (calls HTTP client to fetch/update data)
- `tools/*` → `types.ts` (uses shared types)
- `api/client.ts` → `types.ts` (uses shared types)

```
index.ts
  └── tools/*
        └── api/client.ts
              └── (fetch — native)
        └── types.ts
```

- ✅ `tools` may import from `api/` and `types`
- ✅ `api/client.ts` may import from `types`
- ❌ `api/client.ts` must NOT import from `tools/`
- ❌ `index.ts` must NOT call `fetch` directly — go through `api/client.ts`
- ❌ `types.ts` must NOT import from anywhere else in the project

## Layer Communication

- **MCP client → `index.ts`**: via MCP stdio protocol
- **`index.ts` → tools**: direct function/object import at startup (tool registration)
- **tools → `api/client.ts`**: direct function call (async/await)
- **`api/client.ts` → Mind API**: `fetch()` with Bearer token from env

## Key Principles

1. **One file per tool** — each tool in `src/tools/` exports a single tool definition object. No shared state between tools.
2. **API client is the only HTTP boundary** — all `fetch()` calls live in `src/api/client.ts`. Tools never call `fetch` directly.
3. **Errors never throw past tools** — all errors from `api/client.ts` are caught in the tool and returned as MCP error results (`isError: true`).
4. **stdout is reserved for MCP protocol** — never `console.log()` to stdout. Use `console.error()` for debugging (goes to stderr).
5. **Config from env only** — `MIND_API_URL` and `MIND_PAT_TOKEN` are read once at startup in `api/client.ts`. Never hardcoded, never logged.

## Code Examples

### Tool definition (src/tools/listSessions.ts)

```typescript
import { z } from "zod";
import { fetchSessions } from "../api/client.js";
import type { BreathSession } from "../types.js";

export const listSessionsTool = {
  name: "list_my_breath_sessions",
  description: "Fetch the authenticated user's breathing sessions.",
  inputSchema: z.object({
    limit: z.number().optional().describe("Max sessions to return"),
  }),
  handler: async (input: { limit?: number }) => {
    try {
      const sessions: BreathSession[] = await fetchSessions(input.limit);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(sessions, null, 2) }],
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

### API client (src/api/client.ts)

```typescript
const BASE_URL = process.env.MIND_API_URL;
const TOKEN = process.env.MIND_PAT_TOKEN;

if (!BASE_URL || !TOKEN) {
  throw new Error("MIND_API_URL and MIND_PAT_TOKEN must be set");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchSessions(limit?: number): Promise<BreathSession[]> {
  const qs = limit ? `?limit=${limit}` : "";
  return request<BreathSession[]>(`/breath_sessions${qs}`);
}

export async function patchSession(id: string, data: Partial<BreathSession>): Promise<BreathSession> {
  return request<BreathSession>(`/breath_sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
```

### Tool registration (src/index.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listSessionsTool } from "./tools/listSessions.js";
import { classifySessionTool } from "./tools/classifySession.js";
import { setTimeOfDayTool } from "./tools/setTimeOfDay.js";
import { classifyAllTool } from "./tools/classifyAll.js";

const server = new McpServer({ name: "mind-mcp", version: "1.0.0" });

for (const tool of [listSessionsTool, classifySessionTool, setTimeOfDayTool, classifyAllTool]) {
  server.registerTool(tool.name, tool.description, tool.inputSchema, tool.handler);
}

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Anti-Patterns

- ❌ Don't add a `services/` layer — there is no business logic to put there
- ❌ Don't call `fetch()` inside a tool file — always go through `api/client.ts`
- ❌ Don't use `console.log()` — it corrupts the MCP stdio stream; use `console.error()` only
- ❌ Don't share mutable state between tool handlers — each call must be stateless
- ❌ Don't throw errors out of a tool handler — catch and return `isError: true` result
