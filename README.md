# Mind MCP Server

> MCP-сервер для взаимодействия AI-ассистентов с дыхательными сессиями Mind Awake.

Standalone TypeScript-пакет, который предоставляет функциональность Mind Awake API через протокол [MCP (Model Context Protocol)](https://modelcontextprotocol.io/). Позволяет AI-ассистентам просматривать, классифицировать и обновлять дыхательные сессии пользователя.

## Быстрый старт

```bash
npm install
npm run build
```

Задайте переменные окружения:

```bash
export MIND_API_URL=http://localhost:3000
export MIND_PAT_TOKEN=pat_ваш_токен
```

Запуск:

```bash
npm start
```

## Возможности

- **Просмотр сессий** — получение списка дыхательных сессий с пагинацией
- **AI-классификация** — анализ описания и фаз сессии для определения времени суток
- **Обновление сессий** — установка поля `timeOfDay` (morning / midday / evening)
- **Пакетная классификация** — автоматическая классификация всех неразмеченных сессий

## Пример

Добавьте сервер в конфигурацию MCP-клиента (Claude Desktop, Claude Code и др.):

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

После подключения AI-ассистент получит доступ к инструментам: `list_my_breath_sessions`, `classify_session_time_of_day`, `set_session_time_of_day`, `classify_all_sessions`.

---

## Документация

| Раздел | Описание |
|--------|----------|
| [Начало работы](docs/getting-started.md) | Установка, настройка, первый запуск |
| [Архитектура](docs/architecture.md) | Структура проекта, слои, потоки данных |
| [Инструменты](docs/tools.md) | Описание всех MCP-инструментов |
| [Конфигурация](docs/configuration.md) | Переменные окружения, настройка клиента |

## Лицензия

Private
