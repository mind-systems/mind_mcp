[Назад к README](../README.md) · [Инструменты →](tools.md)

# Начало работы

## Требования

- Node.js ≥ 18.0.0
- Доступ к запущенному Mind API
- Personal Access Token (PAT) от Mind API

## Установка

```bash
cd mind_mcp
npm install
```

## Сборка

```bash
npm run build
```

Все npm-скрипты — в разделе [Конфигурация](configuration.md#npm-скрипты).

## Получение PAT-токена

1. Откройте мобильное приложение Mind Awake
2. Перейдите на экран MCP
3. Создайте новый токен — он будет иметь префикс `pat_`
4. Скопируйте токен

Токен также можно создать через API:

```bash
POST /auth/tokens
```

## Настройка окружения

Задайте две обязательные переменные:

```bash
export MIND_API_URL=http://localhost:3000
export MIND_PAT_TOKEN=pat_ваш_токен
```

Подробнее о всех параметрах — в разделе [Конфигурация](configuration.md).

## Запуск

```bash
npm start
```

Сервер использует stdio-транспорт — он предназначен для запуска MCP-клиентом, а не вручную. При ручном запуске сервер будет ожидать JSON-RPC сообщения на stdin.

## Подключение к MCP-клиенту

### Claude Desktop

Добавьте в `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mind": {
      "command": "node",
      "args": ["/абсолютный/путь/к/mind_mcp/dist/index.js"],
      "env": {
        "MIND_API_URL": "http://localhost:3000",
        "MIND_PAT_TOKEN": "pat_ваш_токен"
      }
    }
  }
}
```

### Claude Code

Добавьте в `.mcp.json` проекта или в глобальные настройки:

```json
{
  "mcpServers": {
    "mind": {
      "command": "node",
      "args": ["./mind_mcp/dist/index.js"],
      "env": {
        "MIND_API_URL": "http://localhost:3000",
        "MIND_PAT_TOKEN": "pat_ваш_токен"
      }
    }
  }
}
```

## Проверка

После подключения попросите AI-ассистента:

> Покажи мои дыхательные сессии

Если всё настроено верно, ассистент вызовет `list_my_breath_sessions` и покажет список сессий.

## Следующие шаги

- [Инструменты](tools.md) — описание всех доступных MCP-инструментов
- [Конфигурация](configuration.md) — все параметры окружения
