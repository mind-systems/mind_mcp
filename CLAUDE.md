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

# Proto
npm run proto:gen          # Regenerate TypeScript stubs from proto/*.proto
```

## Architecture

See `.ai-factory/ARCHITECTURE.md` for folder structure, dependency rules, and code patterns.

## Dependencies on other sub-projects

- **mind_api** — this package is a **gRPC client** of the API. Stubs are generated from the local proto snapshot (`proto/*.proto` → `src/generated/`) via `npm run proto:gen`; the services consumed today are auth (personal access tokens) and breath sessions. Contract changes arrive by copying updated protos from `mind_api/proto/` and regenerating — see Proto contract ownership below.

## Proto contract ownership

`mind_api/proto/` is the single source of truth. This project **must not modify `.proto` files**.

- When `mind_api/proto/` changes, copy the updated files into `mind_mcp/proto/` and run `npm run proto:gen` to regenerate stubs.
- Never symlink — copy explicitly so the proto snapshot in this repo is stable and independent of `mind_api` checkout state.
