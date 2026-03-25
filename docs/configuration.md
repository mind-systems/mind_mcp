[← Инструменты](tools.md) · [Назад к README](../README.md)


# Конфигурация

## Переменные окружения

| Переменная | Обязательная | Описание | Пример |
|------------|:------------:|----------|--------|
| `MIND_GRPC_URL` | да | Адрес gRPC-сервера Mind API | `localhost:50051` |
| `MIND_GRPC_TLS` | нет | Включить TLS на gRPC-канале (`"true"` / `"false"`) | `false` |
| `MIND_PAT_TOKEN` | да | Personal Access Token с префиксом `pat_` | `pat_abc123...` |

Переменные читаются при запуске модуля `api/grpc-client.ts`. Если `MIND_GRPC_URL` или `MIND_PAT_TOKEN` не заданы — сервер завершится с ошибкой.

## Настройка MCP-клиента

Пошаговое подключение к Claude Desktop и Claude Code — в разделе [Начало работы](getting-started.md#подключение-к-mcp-клиенту).

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
- [Инструменты](tools.md) — описание всех MCP-инструментов
