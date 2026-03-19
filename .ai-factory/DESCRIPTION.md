# Project: Mind MCP Server

## Overview

Mind MCP Server is a standalone TypeScript package that exposes Mind Awake API functionality as MCP (Model Context Protocol) tools. It allows AI assistants (Claude Desktop, Claude Code, etc.) to interact with a user's breathing sessions — listing, classifying, and updating them via the Mind API.

## Core Features

- List authenticated user's breathing sessions
- AI-assisted time-of-day classification (morning / midday / evening)
- Update session `timeOfDay` field via PATCH
- Batch classification of all unclassified sessions with confirmation

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Protocol:** MCP (Model Context Protocol) via `@modelcontextprotocol/sdk`
- **Transport:** stdio (launched by MCP client)
- **HTTP Client:** Native `fetch` (no heavy libraries)
- **Build:** TypeScript compiler (`tsc`)
- **Linting:** ESLint + Prettier

## Authentication

Environment-based:
- `MIND_API_URL` — base URL of the Mind API (e.g. `http://localhost:3000`)
- `MIND_PAT_TOKEN` — Personal Access Token (`pat_` prefix) issued by `POST /auth/tokens`

The PAT is sent as a Bearer token in all API requests. No OAuth flow.

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_my_breath_sessions` | Fetch the authenticated user's breathing sessions |
| `classify_session_time_of_day` | Analyse a session and return a suggested `timeOfDay` value |
| `set_session_time_of_day` | Update a session's `timeOfDay` field via PATCH |
| `classify_all_sessions` | Batch classify all unclassified sessions with confirmation |
| `create_breath_session` | Design and persist a new breathing session via POST |

## Architecture Notes

- One file per tool in `src/tools/`, each exporting a tool definition object
- Thin API client in `src/api/` — no heavy HTTP libraries, native `fetch`
- All responses follow MCP tool result format (`content` array with `type: "text"`)
- Errors caught and returned as tool error results, never thrown
- Depends on `mind_api` for PAT endpoints and breath session endpoints

## Architecture
See `.ai-factory/ARCHITECTURE.md` for detailed architecture guidelines.
Pattern: Layered Architecture

## Non-Functional Requirements

- Logging: stderr only (stdout reserved for MCP protocol)
- Error handling: catch all API errors, return as MCP error results
- Security: token read from env only, never logged
