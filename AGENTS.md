# AGENTS.md

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Overview

See `.ai-factory/DESCRIPTION.md` for full project spec and tech stack.

## MCP Tools

| Tool | File | Description |
|------|------|-------------|
| `list_my_breath_sessions` | `tools/listSessions.ts` | Compact list of sessions (no exercises) |
| `get_breath_session` | `tools/getSession.ts` | Full session details by ID |
| `create_breath_session` | `tools/createSession.ts` | Create a new breathing session |
| `classify_session_time_of_day` | `tools/classifySession.ts` | Suggest morning/midday/evening for a session |
| `set_session_time_of_day` | `tools/setTimeOfDay.ts` | PATCH session timeOfDay field |
| `classify_all_sessions` | `tools/classifyAll.ts` | Batch classify all unclassified sessions |

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Commands, conventions, API dependencies |
| `.ai-factory/DESCRIPTION.md` | Project spec and tech stack |
| `.ai-factory/ARCHITECTURE.md` | Folder structure, dependency rules, code patterns |
| `docs/` | User-facing documentation (Russian) |
