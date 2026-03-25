# Project: Mind MCP Server

## Overview

Mind MCP Server is a standalone TypeScript package that exposes Mind Awake API functionality as MCP (Model Context Protocol) tools. It allows AI assistants (Claude Desktop, Claude Code, etc.) to interact with a user's breathing sessions — listing, classifying, and updating them via the Mind API.

## Core Features

- List and view breathing sessions (compact list + full detail)
- Create new breathing sessions with AI-designed exercises
- AI-assisted time-of-day classification (morning / midday / evening)
- Update session `timeOfDay` field via PATCH
- Batch classification of all unclassified sessions with confirmation

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Protocol:** MCP (Model Context Protocol) via `@modelcontextprotocol/sdk`
- **Transport:** stdio (launched by MCP client)
- **gRPC Client:** `@grpc/grpc-js` (for gRPC communication with Mind API)
- **Proto Code Generation:** `ts-proto` (generates TypeScript stubs from `.proto` files)
- **Build:** TypeScript compiler (`tsc`)
- **Linting:** ESLint + Prettier

## Authentication

Environment-based:
- `MIND_GRPC_URL` — gRPC server address (e.g. `localhost:50051`)
- `MIND_GRPC_TLS` — `"true"` to enable TLS on the gRPC channel, defaults to `"false"`
- `MIND_PAT_TOKEN` — Personal Access Token (`pat_` prefix) issued by `POST /auth/tokens`

The PAT is sent as a Bearer token in all API requests. No OAuth flow.

## Architecture

See `ARCHITECTURE.md` for folder structure, dependency rules, and code patterns. Pattern: Layered Architecture.

## Non-Functional Requirements

- Logging: stderr only (stdout reserved for MCP protocol)
- Error handling: catch all API errors, return as MCP error results
- Security: token read from env only, never logged
