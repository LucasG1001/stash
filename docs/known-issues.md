# Known Issues — Zona da busca do AniList

Bugs e melhorias identificados durante a revisão da branch `refactor/dedup-bugs-review`,
mas **não corrigidos** por ficarem em arquivos que outro agente está otimizando (busca da
API do AniList). Deixados aqui para esse agente ou uma branch futura resolver, evitando
conflito de merge.

## Backend

### `services/anilistService.ts`

- **Erro GraphQL não tratado (alta prioridade).** `queryAniList` devolve o payload do
  `cachedRequest` sem inspecionar o array `errors`. A AniList responde HTTP 200 com
  `{ errors: [...], data: null }` em erros de validação, então `data.data.Page.media` /
  `data.data.Media` lançam `TypeError: cannot read 'Page' of null`. Centralizar o
  tratamento aqui resolve os três itens abaixo de uma vez.
- **`getById` deveria retornar 404, não 500.** Para um id inexistente a AniList retorna 404
  (não-retryable) e o `AxiosError` sobe até o controller virando 500 genérico. Além disso
  `anime.stats?.scoreDistribution?.reduce(...)` roda sobre `anime` nulo e quebra antes.
- **`chunk` reinventado.** Loops manuais de batching em `fetchAnimesByIds` (~L181) e
  `discoverFranchise` (~L258) deveriam usar o novo `lib/chunk.ts` (já adotado em
  `youtubeService` e `youtubeLibraryModel`).
- **Membership check O(n) no BFS.** `!frontier.includes(edge.node.id)` é varredura linear
  dentro de laço duplo; `next` já é `Set`, dá para usar `Set` também no frontier.

### `controllers/animeController.ts`

- **`season` sem validação de enum.** `season = reqSeason.toUpperCase()` sem checar contra
  `MediaSeason`; valor inválido vira erro GraphQL → (com o bug acima) `TypeError` → 500.
  Deveria retornar 400.
- **try/catch/notifyError/500 repetido** em todos os handlers — candidato a um wrapper de
  async handler compartilhado.

## Frontend (fluxo de busca)

### `hooks/useMediaList.ts`

- **Sem cancelamento de request.** Nenhum `AbortController` no projeto; digitação rápida
  dispara vários requests sem abort. A proteção contra render obsoleto vem só do guard de
  `currentKey`, mas os requests não são cancelados (banda desperdiçada).
- **`loadMore` pode duplicar página.** O guard `if (... || loading) return` lê `loading` do
  estado, que atrasa um tick; dois cliques rápidos podem anexar a mesma página duas vezes
  (keys duplicadas na grid).

### `pages/AnimePage/AnimePage.tsx` (e clones Movies/Games/Books/Series)

- **Busca esvaziada deixa resultado antigo.** O efeito só age quando
  `debouncedSearch.length >= 2`; ao apagar para 0–1 chars, `items` não é resetado e o
  resultado anterior permanece na tela.
- **Pipeline de agrupamento sem `useMemo`.** `build → filter → filter` roda a cada render,
  mesmo em mudanças não relacionadas (o `DashboardPage` já memoiza — padrão inconsistente).

## Observações estruturais (fora do escopo desta branch)

- **Backend de anime não usa os factories.** `models/libraryModel.ts` e
  `controllers/libraryController.ts` reimplementam ~250 linhas que
  `lib/createLibraryModel` / `lib/createLibraryController` já geram (o frontend já
  convergiu para o store compartilhado). Migração de alto valor, porém grande.
- **Tipos DTO duplicados front/back** com divergências reais (ex.: `AnimeCard.format` só no
  backend; `YoutubeLibraryStatus` inclui `plan_to_watch` morto).
