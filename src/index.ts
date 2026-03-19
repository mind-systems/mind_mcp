import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listSessionsTool } from "./tools/listSessions.js";

const server = new McpServer({ name: "mind-mcp", version: "1.0.0" });

server.tool(
  listSessionsTool.name,
  listSessionsTool.description,
  listSessionsTool.inputSchema,
  listSessionsTool.handler,
);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("mind-mcp server started");
