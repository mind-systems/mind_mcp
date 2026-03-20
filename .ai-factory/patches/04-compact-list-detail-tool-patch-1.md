# Patch: 04 — Compact List & Detail Tool (Round 1)

## Source
Review: `.ai-factory/reviews/04-compact-list-detail-tool-review-1.md`

## Fixes

### Fix 1: Update `list_my_breath_sessions` tool description

**File:** `src/tools/listSessions.ts`
**Line:** 11
**Problem:** The description says `"Fetch the authenticated user's breathing sessions."` but the tool now returns a compact subset (id, description, complexity, timeOfDay, shared) with exercises and other fields stripped. An LLM caller cannot know exercises are excluded without inspecting the response, and will not know `get_breath_session` exists for full details.

**Change:**
```diff
-  description: "Fetch the authenticated user's breathing sessions.",
+  description: "Fetch a compact list of the authenticated user's breathing sessions (id, description, complexity, timeOfDay, shared). Use get_breath_session for full details including exercises.",
```

---

### Fix 2: Update ARCHITECTURE.md folder structure

**File:** `.ai-factory/ARCHITECTURE.md`
**Lines:** 18–29
**Problem:** The folder structure listing only shows 4 tool files (`listSessions.ts`, `classifySession.ts`, `setTimeOfDay.ts`, `classifyAll.ts`). Two tools added in later milestones — `createSession.ts` and `getSession.ts` — are missing.

**Change:**
```diff
 src/
 ├── index.ts           # Entry point — creates McpServer, registers tools, connects transport
 ├── tools/             # MCP tool definitions (one file per tool)
 │   ├── listSessions.ts
 │   ├── classifySession.ts
 │   ├── setTimeOfDay.ts
-│   └── classifyAll.ts
+│   ├── classifyAll.ts
+│   ├── createSession.ts
+│   └── getSession.ts
 ├── api/               # HTTP client for Mind API
 │   └── client.ts      # All fetch() calls, auth header injection
 └── types.ts           # Shared TypeScript types (BreathSession, TimeOfDay, etc.)
```

---

### Fix 3: Update ARCHITECTURE.md code examples

**File:** `.ai-factory/ARCHITECTURE.md`
**Lines:** 69–154
**Problem:** The code examples for `listSessions.ts`, `client.ts`, and `index.ts` are stale — they show the original signatures (e.g. `limit` param, `z.object()` wrapper, `for...of` registration loop, missing `createSession`/`getSession` imports). These examples serve as canonical patterns for future tool authors and should reflect the current code.

**Change — Tool definition example (lines 69–96):**
```diff
 ### Tool definition (src/tools/listSessions.ts)

 ```typescript
 import { z } from "zod";
 import { fetchSessions } from "../api/client.js";
-import type { BreathSession } from "../types.js";

 export const listSessionsTool = {
   name: "list_my_breath_sessions",
-  description: "Fetch the authenticated user's breathing sessions.",
-  inputSchema: z.object({
-    limit: z.number().optional().describe("Max sessions to return"),
-  }),
-  handler: async (input: { limit?: number }) => {
+  description: "Fetch a compact list of the authenticated user's breathing sessions (id, description, complexity, timeOfDay, shared). Use get_breath_session for full details including exercises.",
+  inputSchema: {
+    page: z.number().optional().describe("Page number (1-based)"),
+    pageSize: z.number().optional().describe("Number of sessions per page"),
+  },
+  handler: async (input: { page?: number; pageSize?: number }) => {
     try {
-      const sessions: BreathSession[] = await fetchSessions(input.limit);
+      const result = await fetchSessions(input.page, input.pageSize);
+      const compact = {
+        total: result.total,
+        page: result.page,
+        pageSize: result.pageSize,
+        data: result.data.map(({ id, description, complexity, timeOfDay, shared }) => ({
+          id, description, complexity, timeOfDay, shared,
+        })),
+      };
       return {
-        content: [{ type: "text" as const, text: JSON.stringify(sessions, null, 2) }],
+        content: [{ type: "text" as const, text: JSON.stringify(compact, null, 2) }],
       };
     } catch (err) {
       return {
```

**Change — API client example (lines 98–134):**
```diff
 ### API client (src/api/client.ts)

 ```typescript
+import type {
+  BreathSession,
+  BreathSessionListResponse,
+  CreateBreathSessionPayload,
+} from "../types.js";
+
 const BASE_URL = process.env.MIND_API_URL;
 const TOKEN = process.env.MIND_PAT_TOKEN;
 ...
-export async function fetchSessions(limit?: number): Promise<BreathSession[]> {
-  const qs = limit ? `?limit=${limit}` : "";
-  return request<BreathSession[]>(`/breath_sessions${qs}`);
+export async function fetchSessions(page?: number, pageSize?: number): Promise<BreathSessionListResponse> {
+  const params = new URLSearchParams();
+  if (page !== undefined) params.set("page", String(page));
+  if (pageSize !== undefined) params.set("pageSize", String(pageSize));
+  const qs = params.toString() ? `?${params.toString()}` : "";
+  return request<BreathSessionListResponse>(`/breath_sessions/list${qs}`);
+}
+
+export async function fetchSession(id: string): Promise<BreathSession> {
+  return request<BreathSession>(`/breath_sessions/${id}`);
 }

 export async function patchSession(id: string, data: Partial<BreathSession>): Promise<BreathSession> {
 ...
 }
+
+export async function createSession(data: CreateBreathSessionPayload): Promise<BreathSession> {
+  return request<BreathSession>("/breath_sessions", {
+    method: "POST",
+    body: JSON.stringify(data),
+  });
+}
 ```
```

**Change — Tool registration example (lines 136–154):**
```diff
 ### Tool registration (src/index.ts)

 ```typescript
 import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
 import { listSessionsTool } from "./tools/listSessions.js";
 import { classifySessionTool } from "./tools/classifySession.js";
 import { setTimeOfDayTool } from "./tools/setTimeOfDay.js";
 import { classifyAllTool } from "./tools/classifyAll.js";
+import { createSessionTool } from "./tools/createSession.js";
+import { getSessionTool } from "./tools/getSession.js";

 const server = new McpServer({ name: "mind-mcp", version: "1.0.0" });

-for (const tool of [listSessionsTool, classifySessionTool, setTimeOfDayTool, classifyAllTool]) {
-  server.registerTool(tool.name, tool.description, tool.inputSchema, tool.handler);
-}
+server.tool(
+  listSessionsTool.name,
+  listSessionsTool.description,
+  listSessionsTool.inputSchema,
+  listSessionsTool.handler,
+);
+// ... same pattern for classifySessionTool, setTimeOfDayTool, classifyAllTool,
+//     createSessionTool, getSessionTool

 const transport = new StdioServerTransport();
 await server.connect(transport);
+
+console.error("mind-mcp server started");
 ```
```
