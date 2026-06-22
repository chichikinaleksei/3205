# URL Checker Assignment

Fullstack TypeScript app for asynchronous URL checks.

## Stack

- Backend: Node.js, Express, TypeScript, in-memory storage
- Frontend: React, TypeScript, Zustand, Vite
- Docker: separate API and web services

## Features

- `POST /api/jobs` creates a job from a list of URLs.
- `GET /api/jobs` returns recent jobs with status and stats.
- `GET /api/jobs/:id` returns URL-level check details.
- `DELETE /api/jobs/:id` cancels a job and stops queued URL checks.
- Each URL is checked with an HTTP `HEAD` request.
- A random 0-10 second delay is applied before saving each URL result.
- Each job runs at most 5 concurrent `HEAD` requests.
- Multiple jobs can run at the same time.
- The frontend polls active job details and guards against stale responses.

## Local Development

Install dependencies:

```bash
npm install
```

Run API and web app together:

```bash
npm run dev
```

Open:

- Web: http://localhost:5173
- API: http://localhost:3001

Run checks:

```bash
npm run typecheck
npm run build
```

## API

Create a job:

```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com","https://github.com"]}'
```

List jobs:

```bash
curl http://localhost:3001/api/jobs
```

Get job details:

```bash
curl http://localhost:3001/api/jobs/<jobId>
```

Cancel a job:

```bash
curl -X DELETE http://localhost:3001/api/jobs/<jobId>
```

## Docker

Build and run:

```bash
docker compose up --build
```

Open:

- Web: http://localhost:4173
- API: http://localhost:3001

## Environment

API:

- `PORT` defaults to `3001`
- `CORS_ORIGIN` defaults to all origins

Web:

- `VITE_API_BASE_URL` defaults to `http://localhost:3001`
