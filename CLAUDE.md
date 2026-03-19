# CLAUDE.md

This file provides guidance to Claude Code when working with the Mind MCP Server.

## Overview

Mind MCP Server is a standalone TypeScript package that exposes Mind Awake API functionality as MCP (Model Context Protocol) tools. It allows AI assistants to interact with a user's breathing sessions — listing, classifying, and updating them.

## Commands

```bash
# Development
npm run build              # Compile TypeScript
npm run dev                # Watch mode
npm start                  # Run compiled output (stdio transport)

# Linting & formatting
npm run lint               # ESLint --fix
npm run format             # Prettier
```

## Architecture

**Transport:** stdio (designed to be launched by an MCP client such as Claude Desktop or Claude Code).

**Authentication:** Environment-based. The server reads:
- `MIND_API_URL` — base URL of the Mind API (e.g. `http://localhost:3000`)
- `MIND_PAT_TOKEN` — Personal Access Token (`pat_` prefix) issued by `POST /auth/tokens`

The PAT is sent as a Bearer token in all API requests. No OAuth flow — the user generates a token from the mobile app's MCP screen and pastes it into the MCP client config.

### Tools

| Tool | Description |
|------|-------------|
| `list_my_breath_sessions` | Fetch the authenticated user's breathing sessions |
| `classify_session_time_of_day` | AI-assisted classification — analyse a session's description and phases, return a suggested `timeOfDay` value (`morning`, `midday`, `evening`) |
| `set_session_time_of_day` | Update a session's `timeOfDay` field via `PATCH` |
| `classify_all_sessions` | Batch classification of all unclassified sessions with confirmation |

### Project structure

```
mind_mcp/
├── src/
│   ├── index.ts           # Entry point, MCP server setup
│   ├── tools/             # One file per tool
│   ├── api/               # HTTP client for Mind API
│   └── types.ts           # Shared types
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

### Key conventions

- Each tool is a separate file in `src/tools/` exporting a tool definition object.
- The API client (`src/api/`) is a thin wrapper around `fetch` — no heavy HTTP libraries.
- All responses follow MCP tool result format (`content` array with `type: "text"`).
- Error handling: API errors are caught and returned as tool error results, never thrown.

## Dependencies on other sub-projects

- **mind_api** — this package is a client of the API. It depends on:
  - Personal Access Tokens endpoints (`POST/GET/DELETE /auth/tokens`)
  - Breath Sessions endpoints (`GET /breath_sessions`, `PATCH /breath_sessions/:id`)
  - The `timeOfDay` field on breath sessions

DTO shapes consumed here must stay in sync with the API response contracts.
