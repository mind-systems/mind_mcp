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

## Configuration & logging

Environment-based, no OAuth flow:
- `MIND_GRPC_URL` — gRPC server address (e.g. `localhost:50051`)
- `MIND_GRPC_TLS` — `"true"` enables TLS on the channel; defaults to `"false"`
- `MIND_PAT_TOKEN` — Personal Access Token (`pat_` prefix), sent as Bearer; read from env only, never logged

**Logs go to stderr only — stdout is reserved for the MCP protocol.** Writing anything else to stdout breaks the client connection.

## Proto contract ownership

Consumer of `mind_api/proto/` (see root CLAUDE.md for ownership policy). On upstream change, copy the updated files into `mind_mcp/proto/` and run `npm run proto:gen` to regenerate stubs.
