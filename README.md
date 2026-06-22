# URL Checker

Fullstack-приложение для асинхронной проверки списка URL.

## Стек

- Backend: Node.js, Express, TypeScript, in-memory хранение
- Frontend: React, TypeScript, Zustand, Vite
- Docker: отдельные сервисы для API и веб-приложения

## Возможности

- `POST /api/jobs` создает задание из списка URL.
- `GET /api/jobs` возвращает список заданий со статусами и статистикой.
- `GET /api/jobs/:id` возвращает детальную информацию по каждому URL.
- `DELETE /api/jobs/:id` отменяет задание и останавливает URL, которые еще не начали обрабатываться.
- Для каждого URL выполняется HTTP `HEAD`-запрос.
- Перед сохранением результата добавляется случайная задержка от 0 до 10 секунд.
- Внутри одного задания одновременно выполняется не больше 5 `HEAD`-запросов.
- Несколько заданий могут выполняться одновременно.
- Фронтенд периодически опрашивает активное задание и защищен от устаревших ответов по старому `jobId`.

## Локальный запуск

Установить зависимости:

```bash
npm install
```

Запустить API и фронтенд вместе:

```bash
npm run dev
```

Открыть в браузере:

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Ручная проверка

После запуска приложения откройте http://localhost:5173 и вставьте в textarea:

```text
http://localhost:3001/api/health
http://localhost:3001/missing
```

Нажмите **Start check**.

Ожидаемый результат:

- задание появится в списке `Jobs`;
- сначала статус будет `In progress`;
- после обработки статус станет `Completed`;
- URL `/api/health` вернет `Success` и HTTP-код `200`;
- URL `/missing` вернет `Error` и HTTP-код `404`;
- в статистике будет `1 ok` и `1 err`.

Проверка отмены:

1. Вставьте 5-10 URL, например несколько раз `http://localhost:3001/api/health`.
2. Нажмите **Start check**.
3. Сразу нажмите **Cancel**.
4. Задание должно перейти в статус `Cancelled`.

## Проверка сборки

Запустить TypeScript-проверку:

```bash
npm run typecheck
```

Собрать backend и frontend:

```bash
npm run build
```

Обе команды должны завершиться без ошибок.

## API

Создать задание:

```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com","https://github.com"]}'
```

Получить список заданий:

```bash
curl http://localhost:3001/api/jobs
```

Получить детали задания:

```bash
curl http://localhost:3001/api/jobs/<jobId>
```

Отменить задание:

```bash
curl -X DELETE http://localhost:3001/api/jobs/<jobId>
```

## Docker

Собрать и запустить:

```bash
docker compose up --build
```

После запуска открыть:

- Frontend: http://localhost:4173
- API: http://localhost:3001

## Переменные окружения

API:

- `PORT` по умолчанию `3001`
- `CORS_ORIGIN` по умолчанию разрешает все origins

Frontend:

- `VITE_API_BASE_URL` по умолчанию `http://localhost:3001`
