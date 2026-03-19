# AGENTS.md

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Project Overview

Mind MCP Server is a standalone TypeScript package that exposes Mind Awake API functionality as MCP (Model Context Protocol) tools. It allows AI assistants to interact with a user's breathing sessions — listing, classifying, and updating them via the Mind API backend.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Protocol:** MCP via `@modelcontextprotocol/sdk`
- **Transport:** stdio (launched by MCP client: Claude Desktop, Claude Code, etc.)
- **HTTP Client:** Native `fetch` — no heavy libraries
- **Build:** `tsc`
- **Linting:** ESLint + Prettier

## Project Structure

```
mind_mcp/
├── src/
│   ├── index.ts           # Entry point — MCP server setup, tool registration
│   ├── tools/             # One file per MCP tool
│   │   ├── listSessions.ts
│   │   ├── classifySession.ts
│   │   ├── setTimeOfDay.ts
│   │   └── classifyAll.ts
│   ├── api/               # Thin HTTP client for Mind API
│   │   └── client.ts
│   └── types.ts           # Shared TypeScript types
├── .ai-factory/
│   ├── DESCRIPTION.md     # Project specification
│   └── ARCHITECTURE.md    # Architecture decisions
├── .mcp.json              # MCP server config (filesystem, github)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
├── AGENTS.md              # This file
└── CLAUDE.md              # Agent instructions
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/index.ts` | Server bootstrap — creates McpServer, registers tools, connects stdio transport |
| `src/api/client.ts` | All HTTP calls to Mind API — reads `MIND_API_URL` + `MIND_PAT_TOKEN` from env |
| `src/types.ts` | Shared types (BreathSession, TimeOfDay, etc.) |

## MCP Tools

| Tool | File | Description |
|------|------|-------------|
| `list_my_breath_sessions` | `tools/listSessions.ts` | List authenticated user's sessions |
| `classify_session_time_of_day` | `tools/classifySession.ts` | Suggest morning/midday/evening for a session |
| `set_session_time_of_day` | `tools/setTimeOfDay.ts` | PATCH session timeOfDay field |
| `classify_all_sessions` | `tools/classifyAll.ts` | Batch classify all unclassified sessions |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MIND_API_URL` | Base URL of the Mind API (e.g. `http://localhost:3000`) |
| `MIND_PAT_TOKEN` | Personal Access Token (`pat_` prefix) from the mobile app |

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | `README.md` | Project landing page |
| Getting Started | `docs/getting-started.md` | Installation, setup, first steps |
| Architecture | `docs/architecture.md` | Project structure and data flow |
| Tools | `docs/tools.md` | MCP tools reference |
| Configuration | `docs/configuration.md` | Environment variables, client setup |
| CLAUDE.md | `CLAUDE.md` | Agent instructions and key conventions |
| Description | `.ai-factory/DESCRIPTION.md` | Full project specification |
| Architecture (AI) | `.ai-factory/ARCHITECTURE.md` | Architecture decisions |

## AI Context Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | This file — project structure map |
| `CLAUDE.md` | Agent instructions, commands, conventions |
| `.ai-factory/DESCRIPTION.md` | Project specification and tech stack |
| `.ai-factory/ARCHITECTURE.md` | Architecture pattern and folder structure |

## Related Sub-projects

This MCP server is a **client** of `mind_api`. DTO shapes consumed here must stay in sync with the API response contracts in `mind_api/src/breath-sessions/` and `mind_api/src/auth/`.
