# CLAUDE.md

This file provides guidance to Claude Code when working with the Mind MCP Server.

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

See `.ai-factory/ARCHITECTURE.md` for folder structure, dependency rules, and code patterns.

## Dependencies on other sub-projects

- **mind_api** — this package is a client of the API. It depends on:
  - Personal Access Tokens endpoints (`POST/GET/DELETE /auth/tokens`)
  - Breath Sessions endpoints (`GET /breath_sessions/list`, `GET /breath_sessions/:id`, `POST /breath_sessions`, `PATCH /breath_sessions/:id`)
  - The `timeOfDay` field on breath sessions

DTO shapes consumed here must stay in sync with the API response contracts.

## Proto contract ownership

`mind_api/proto/` is the single source of truth. This project **must not modify `.proto` files**.

- When `mind_api/proto/` changes, copy the updated files into `mind_mcp/proto/` and run `npm run proto:gen` to regenerate stubs.
- Never symlink — copy explicitly so the proto snapshot in this repo is stable and independent of `mind_api` checkout state.
