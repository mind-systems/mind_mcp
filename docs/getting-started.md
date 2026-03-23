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

## Подключение к MCP-клиенту

Сервер использует stdio-транспорт — запускается MCP-клиентом автоматически, не вручную.

### Prod

```bash
claude mcp add mind npx @mind-awake.life/mcp \
  -e MIND_API_URL=https://api.mind-awake.life \
  -e MIND_PAT_TOKEN=pat_ваш_токен
```

### Dev

```bash
claude mcp add mind npx @mind-awake.life/mcp@dev \
  -e MIND_API_URL=https://dev-api.mind-awake.life \
  -e MIND_PAT_TOKEN=pat_ваш_токен
```

### Локальная разработка

```bash
npm run build

claude mcp add mind node ./dist/index.js \
  -e MIND_API_URL=http://localhost:3001 \
  -e MIND_PAT_TOKEN=pat_ваш_токен
```

Для глобальной установки (доступен во всех проектах) добавьте флаг `-s user`.

Подробнее о переменных окружения — в разделе [Конфигурация](configuration.md).

## Проверка

После подключения попросите AI-ассистента:

> Покажи мои дыхательные сессии

Если всё настроено верно, ассистент вызовет `list_my_breath_sessions` и покажет список сессий.

## Следующие шаги

- [Инструменты](tools.md) — описание всех доступных MCP-инструментов
- [Конфигурация](configuration.md) — все параметры окружения
