import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listSessionsTool } from "./tools/listSessions.js";
import { classifySessionTool } from "./tools/classifySession.js";
import { setTimeOfDayTool } from "./tools/setTimeOfDay.js";
import { classifyAllTool } from "./tools/classifyAll.js";

const server = new McpServer({ name: "mind-mcp", version: "1.0.0" });

server.tool(
  listSessionsTool.name,
  listSessionsTool.description,
  listSessionsTool.inputSchema,
  listSessionsTool.handler,
);

server.tool(
  classifySessionTool.name,
  classifySessionTool.description,
  classifySessionTool.inputSchema,
  classifySessionTool.handler,
);

server.tool(
  setTimeOfDayTool.name,
  setTimeOfDayTool.description,
  setTimeOfDayTool.inputSchema,
  setTimeOfDayTool.handler,
);

server.tool(
  classifyAllTool.name,
  classifyAllTool.description,
  classifyAllTool.inputSchema,
  classifyAllTool.handler,
);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("mind-mcp server started");
