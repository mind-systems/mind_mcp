# Mind MCP Server — Roadmap

## Milestones

- [x] **Core** — standalone TypeScript MCP package (`mind_mcp/`); stdio transport; env-based auth (`MIND_API_URL` + `MIND_JWT_TOKEN`); tool: `list_my_breath_sessions`
- [x] **AI Classification** — tools: `classify_session_time_of_day` (Claude analyses description + phases, returns suggestion), `set_session_time_of_day` (PATCH API), `classify_all_sessions` (batch with confirmation)

- [x] **Session Creation Tool** — `create_breath_session` tool: AI agent designs breathing exercises based on user request (goal, difficulty, time of day); creates session via existing POST API endpoint
- [x] **Compact List & Detail Tool** — `list_my_breath_sessions` strips `exercises` from response (returns only id, description, complexity, timeOfDay, shared); new `get_breath_session(id)` tool for full session details on demand; no API changes, filtering done in MCP layer

## Completed

| Milestone | Date |
|-----------|------|
