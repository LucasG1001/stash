# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Media Tracker** is a full-stack anime collection manager (single-user, no auth). The frontend proxies all `/api` calls to the backend, which proxies AniList GraphQL and persists user data in PostgreSQL.

## Development Commands

### Local Development (requires SSH tunnel to remote PostgreSQL)

```bash
# Terminal 1: tunnel to VPS database
ssh -L 5432:localhost:5432 lucas@187.77.62.157

# Terminal 2: backend (hot-reload via tsx)
cd backend && npm run dev        # http://localhost:3333

# Terminal 3: frontend (Vite dev server)
cd frontend && npm run dev       # http://localhost:5173
```

### Build & Production

```bash
cd backend && npm run build      # tsc → dist/
cd backend && npm start          # node dist/server.js

cd frontend && npm run build     # tsc + vite → dist/
cd frontend && npm run lint      # ESLint check
```

### Docker (full stack)

```bash
docker-compose up --build        # http://localhost:8080 (WEB_PORT in .env)
```

## Architecture

### Data Flow

```
Browser → Vite dev proxy (or Nginx in prod)
        → Express backend (:3333)
        → AniList GraphQL API (external, no auth)
        → PostgreSQL (local or via SSH tunnel)
```

The backend runs `migrate()` on startup — table creation is idempotent, no migration files needed.

### Backend (`backend/src/`)

- **`server.ts`** — Express app, route registration, runs DB migration before listening
- **`database/connection.ts`** — pg Pool initialization
- **`database/migrate.ts`** — Creates `anime_library` table if not exists
- **`services/anilistService.ts`** — All AniList GraphQL queries; maps external data to internal types
- **`models/libraryModel.ts`** — Raw SQL queries; maps DB `snake_case` → code `camelCase`
- **`controllers/`** — Thin handlers; delegate to services/models
- **`routes/`** — Route definitions only (`animeRoutes.ts`, `libraryRoutes.ts`)

### Frontend (`frontend/src/`)

- **`App.tsx`** — BrowserRouter + layout; routes to `AnimePage`, placeholder pages (Movies, Series, Books, Games)
- **`pages/AnimePage/`** — Primary page; tabs: Seasons, Popular, Search, Library
- **`hooks/useAnime.ts`** — Anime list state + pagination (load-more pattern)
- **`hooks/useLibrary.ts`** — Library CRUD with optimistic local state
- **`services/api.ts`** — Axios instance; `VITE_API_URL` env var sets base URL
- **`styles/global.css`** — CSS custom properties (dark theme colors, spacing, typography)

### API Endpoints

- `GET /api/anime/season?season=WINTER&year=2026&page=1`
- `GET /api/anime/popular?page=1`
- `GET /api/anime/search?q=query&page=1`
- `GET /api/anime/:id`
- `GET/POST /api/library`
- `PUT/DELETE /api/library/:id`

All responses use `{ animes, pageInfo }` shape for lists; errors return `{ error: "Portuguese message" }`.

### Database Schema (`anime_library` table)

| Column             | Type           | Notes                                             |
| ------------------ | -------------- | ------------------------------------------------- |
| `id`               | UUID PK        | auto-generated                                    |
| `anilist_id`       | INTEGER UNIQUE | AniList external ID                               |
| `status`           | TEXT           | `plan_to_watch \| watching \| watched \| dropped` |
| `score`            | NUMERIC(3,1)   | 0–10                                              |
| `watched_episodes` | INTEGER        | user progress                                     |
| `anime_status`     | TEXT           | `RELEASING \| FINISHED \| NOT_YET_RELEASED`       |

## Key Conventions

### Language

- **Code** (variables, functions, types, filenames): English
- **User-facing strings** (API error messages, UI text): Portuguese

### TypeScript

- Strict mode enabled on both backend and frontend — no `any`
- Backend uses `"module": "NodeNext"`: imports must include `.js` extension (e.g., `import { pool } from '../database/connection.js'`)
- Frontend uses `"moduleResolution": "bundler"` — no extension needed

### Styling

- CSS Modules (`.module.css`) per component — no external UI libraries
- Global CSS variables defined in `frontend/src/styles/global.css`; always use variables, never hardcode colors/sizes

### State Management

- React hooks only (`useState`, `useContext`, `useReducer`) — no Redux, Zustand, or similar libraries
- No comments in code

### HTTP Status Codes

- `201` for create, `204` for delete, `400` for validation errors, `404` not found, `409` conflict (duplicate `anilist_id`), `500` server error

## External Integration: AniList

- GraphQL endpoint: `https://graphql.anilist.co` (POST, no auth)
- Rate limit: 90 req/min
- Season logic: backend maps months to seasons (1–3 → WINTER, 4–6 → SPRING, 7–9 → SUMMER, 10–12 → FALL)
- UI shows previous/current/next season in the dropdown; season names displayed in Portuguese

## Environment Variables

Copy `backend/.env.example` to `backend/.env` for local dev:

```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT (default 3333)
```

Copy `.env.example` to `.env` at root for Docker:

```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, WEB_PORT
```

## Fluxo de trabalho

- Para tarefas que envolvam mais de um arquivo, apresente um plano e aguarde aprovação antes de editar.
- Tarefas simples (1 arquivo, mudança pequena) pode executar direto.
