# Mind MCP Server

> MCP-сервер для взаимодействия AI-ассистентов с дыхательными сессиями Mind Awake.

Standalone TypeScript-пакет, который предоставляет функциональность Mind Awake API через протокол [MCP (Model Context Protocol)](https://modelcontextprotocol.io/). Позволяет AI-ассистентам просматривать, классифицировать и обновлять дыхательные сессии пользователя.

## Установка

Получите токен в мобильном приложении Mind Awake → раздел MCP. Токен выглядит как `pat_abc123...` — скопируйте его и вставьте вместо `pat_xxx` в команду ниже.

**Для пользователей (prod):**

```bash
claude mcp add mind npx @mind-awake.life/mcp \
  -e MIND_GRPC_URL=grpc.mind-awake.life:443 \
  -e MIND_GRPC_TLS=true \
  -e MIND_PAT_TOKEN=pat_xxx
```

**Для пользователей (dev/бета):**

```bash
claude mcp add mind npx @mind-awake.life/mcp@dev \
  -e MIND_GRPC_URL=dev-grpc.mind-awake.life:443 \
  -e MIND_GRPC_TLS=true \
  -e MIND_PAT_TOKEN=pat_xxx
```

**Для локальной разработки:**

```bash
# собрать пакет
npm run build

# подключить локально
claude mcp add mind node ./dist/index.js \
  -e MIND_GRPC_URL=localhost:50051 \
  -e MIND_GRPC_TLS=false \
  -e MIND_PAT_TOKEN=pat_xxx
```

## Возможности

- **Просмотр сессий** — компактный список с пагинацией + детальный просмотр по ID
- **Создание сессий** — AI-ассистент проектирует дыхательную программу по запросу пользователя
- **AI-классификация** — анализ описания и фаз сессии для определения времени суток
- **Обновление сессий** — установка поля `timeOfDay` (morning / midday / evening)
- **Пакетная классификация** — автоматическая классификация всех неразмеченных сессий

"покажи мои дыхательные сессии"
"создай дыхательную сессию на утро"
"классифицируй все неразмеченные сессии"

После подключения AI-ассистент получит доступ к инструментам: `list_my_breath_sessions`, `get_breath_session`, `create_breath_session`, `classify_session_time_of_day`, `set_session_time_of_day`, `classify_all_sessions`.

---

## Документация

| Раздел | Описание |
|--------|----------|
| [Начало работы](docs/getting-started.md) | Установка, настройка, первый запуск |
| [Инструменты](docs/tools.md) | Описание всех MCP-инструментов |
| [Конфигурация](docs/configuration.md) | Переменные окружения, настройка клиента |

## Лицензия

MIT
