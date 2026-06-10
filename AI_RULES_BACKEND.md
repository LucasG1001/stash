# Padrões e Boas Práticas do Backend (Media Tracker)
*Leia este arquivo antes de sugerir ou escrever qualquer código para este projeto.*

## 0. Visão Geral do Projeto

**Media Tracker** é uma aplicação web de gerenciamento pessoal de mídia, inspirada no MyAnimeList. O sistema tem duas partes:
- `frontend/` — React + Vite + TypeScript (CSS Modules)
- `backend/` — Node.js + Express + TypeScript + PostgreSQL (este diretório)

O frontend se comunica exclusivamente com o backend via API REST. O backend é responsável por:
1. **Proxy da API do AniList** — o frontend nunca consome o AniList diretamente.
2. **CRUD da biblioteca pessoal** — persistência com PostgreSQL.

Nesta primeira versão, apenas a seção **Anime** é funcional. Não há autenticação, login ou múltiplos usuários. A aplicação é de uso local e pessoal.

---

## 1. Idioma e Comentários
- **Código em Inglês:** Variáveis, funções, tipos, rotas, arquivos e pastas.
- **Mensagens de erro ao usuário em Português:** Strings retornadas nos campos `error` do JSON.
- **Zero Comentários:** Código limpo e autoexplicativo. Sem comentários no código final.

---

## 2. Stack Técnica e Restrições
- **Runtime:** Node.js com TypeScript (`strict: true`). Proibido `any` e `eslint-disable`.
- **Framework:** Express.
- **Banco de Dados:** PostgreSQL via `pg` (pool de conexão). Nenhum ORM.
- **HTTP Client:** Axios para consumir a API do AniList (GraphQL).
- **Dev Runner:** `tsx watch src/server.ts` para hot-reload em desenvolvimento.
- **Build de Produção:** `tsc` compila para `dist/`. Em produção roda `node dist/server.js`.
- **Variáveis de Ambiente:** Carregadas via `dotenv`. Nunca hardcoded no código.
- **Module System:** `"module": "NodeNext"` no tsconfig — imports internos usam extensão `.js` mesmo sendo `.ts` (ex: `import { pool } from '../database/connection.js'`).

---

## 3. Convenções de Nomenclatura
- **Banco de dados:** `snake_case` para tabelas e colunas (`anilist_id`, `cover_image`, `watched_episodes`, `created_at`).
- **Código TypeScript e JSON da API:** `camelCase` (`anilistId`, `coverImage`, `watchedEpisodes`, `createdAt`).
- A camada de controllers/routes é responsável por mapear entre os dois formatos.

---

## 4. Estrutura de Pastas
```
backend/
  src/
    server.ts              ← entry point: roda migrate() ANTES do listen()
    database/
      connection.ts        ← pool de conexão PostgreSQL (usa DATABASE_URL do .env)
      migrate.ts           ← criação de tabelas (idempotente, IF NOT EXISTS)
    routes/
      animeRoutes.ts       ← rotas de proxy do AniList
      libraryRoutes.ts     ← rotas CRUD da biblioteca pessoal
    controllers/
      animeController.ts   ← lógica das rotas de anime
      libraryController.ts ← lógica das rotas de biblioteca
    services/
      anilistService.ts    ← queries GraphQL para a API do AniList
    types/
      anime.ts             ← interfaces TypeScript
      library.ts
    models/
      libraryModel.ts      ← operações no banco de dados
  .env                     ← credenciais locais (não vai para o git)
  .env.example             ← template das variáveis (vai para o git)
  AI_RULES_BACKEND.md
```

---

## 5. Schema do Banco de Dados
```sql
CREATE TABLE IF NOT EXISTS anime_library (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anilist_id       INTEGER NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  cover_image      TEXT,
  status           TEXT NOT NULL DEFAULT 'plan_to_watch',
  score            NUMERIC(3,1) DEFAULT 0,
  watched_episodes INTEGER NOT NULL DEFAULT 0,
  total_episodes   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Observações importantes:**
- `id` é `UUID` com geração automática via `gen_random_uuid()`.
- `anilist_id` é `UNIQUE` — um anime só pode estar uma vez na biblioteca.
- `status` aceita: `plan_to_watch`, `watching`, `watched`, `dropped`.
- `score` é `NUMERIC(3,1)` de 0 a 10 (permite decimais como 7.5).
- `created_at` e `updated_at` são `TIMESTAMPTZ`.
- `updated_at` deve ser atualizado manualmente em cada UPDATE via `NOW()`.

---

## 6. Rotas da API

Base URL em dev: `http://localhost:3333`

### Proxy AniList (dados externos)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/anime/season/current` | Animes da temporada atual |
| GET | `/api/anime/season/next` | Animes da próxima temporada |
| GET | `/api/anime/popular` | Animes mais populares |
| GET | `/api/anime/search?q=` | Busca por nome |
| GET | `/api/anime/:id` | Detalhes de um anime específico |

### Biblioteca pessoal (dados locais)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/library` | Retorna todos os animes da biblioteca |
| POST | `/api/library` | Adiciona anime à biblioteca |
| PUT | `/api/library/:id` | Atualiza status, nota ou progresso |
| DELETE | `/api/library/:id` | Remove anime da biblioteca |

**Padrões de resposta:**
- `201` em criações, `204` em deleções, `404` quando não encontrado.
- PUT sempre retorna o objeto completo e atualizado.
- Erros retornam `{ "error": "mensagem em português" }`.

---

## 7. API do AniList

- **URL:** `https://graphql.anilist.co`
- **Método:** POST (GraphQL)
- **Autenticação:** Nenhuma (API pública).
- **Campos a buscar:** `id`, `title`, `coverImage`, `bannerImage`, `description`, `status`, `episodes`, `genres`, `studios`, `season`, `seasonYear`, `averageScore`, `trailer`, `nextAiringEpisode`, `externalLinks` (para plataformas de streaming).
- **Rate Limit:** Respeitar limite de 90 requests/minuto do AniList.

---

## 8. Ambientes

### Desenvolvimento (local)
```bash
# Pré-requisito: SSH tunnel ativo para o PostgreSQL na VPS
ssh -L 5432:localhost:5432 lucas@187.77.62.157

# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

O arquivo `backend/.env` aponta para `127.0.0.1:5432` (banco na VPS via tunnel).
O frontend roda em `http://localhost:5173` e faz proxy para o backend em `http://localhost:3333`.

### Produção
Não há deploy automatizado nesta versão. A aplicação é de uso local apenas.

---

## 9. Frontend — Como se Integra

O frontend (`frontend/`) usa:
- `frontend/src/services/animeService.ts` — chamadas ao backend para dados do AniList.
- `frontend/src/services/libraryService.ts` — chamadas ao backend para CRUD da biblioteca.
- `frontend/src/hooks/useAnime.ts` e `useLibrary.ts` — consomem os services, gerenciam estado com `useState`, expõem `loading` e `error`.
- A URL base é configurável via variável de ambiente `VITE_API_URL` (default: `http://localhost:3333`).

---

## 10. Evolução destas Regras (Nota para a IA)
- **Atualização Contínua:** Se identificar um padrão importante não documentado, adicione aqui.
- **Seja Conciso:** Mantenha as adições curtas e diretas, este arquivo é sua memória do projeto.
