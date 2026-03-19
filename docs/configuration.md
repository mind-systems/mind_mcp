[← Инструменты](tools.md) · [Назад к README](../README.md)

# Конфигурация

## Переменные окружения

| Переменная | Обязательная | Описание | Пример |
|------------|:------------:|----------|--------|
| `MIND_API_URL` | да | Базовый URL Mind API | `http://localhost:3000` |
| `MIND_PAT_TOKEN` | да | Personal Access Token с префиксом `pat_` | `pat_abc123...` |

Обе переменные читаются при запуске модуля `api/client.ts`. Если хотя бы одна не задана — сервер завершится с ошибкой.

## Настройка MCP-клиента

Переменные передаются через конфигурацию MCP-клиента в блоке `env`:

```json
{
  "mcpServers": {
    "mind": {
      "command": "node",
      "args": ["/path/to/mind_mcp/dist/index.js"],
      "env": {
        "MIND_API_URL": "http://localhost:3000",
        "MIND_PAT_TOKEN": "pat_ваш_токен"
      }
    }
  }
}
```

### Расположение конфигурации

| Клиент | Файл |
|--------|------|
| Claude Desktop | `claude_desktop_config.json` |
| Claude Code (проект) | `.mcp.json` в корне проекта |
| Claude Code (глобально) | `~/.claude/settings.json` |

## Транспорт

Сервер работает через **stdio** — JSON-RPC сообщения передаются через stdin/stdout. Это стандартный транспорт для локальных MCP-серверов.

Stdout полностью зарезервирован под MCP-протокол. Диагностические сообщения выводятся в stderr.

## npm-скрипты

| Команда | Описание |
|---------|----------|
| `npm run build` | Компиляция TypeScript → `dist/` |
| `npm run dev` | Watch-режим (перекомпиляция при изменениях) |
| `npm start` | Запуск скомпилированного сервера |
| `npm run lint` | ESLint с автофиксом |
| `npm run format` | Prettier |

## См. также

- [Начало работы](getting-started.md) — пошаговая настройка
- [Архитектура](architecture.md) — как устроен сервер
