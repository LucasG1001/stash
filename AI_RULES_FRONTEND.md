# Padrões e Boas Práticas do Frontend (Media Tracker)
*Leia este arquivo antes de sugerir ou escrever qualquer código para este projeto.*

## 0. Visão Geral do Projeto

**Media Tracker** é uma aplicação web de gerenciamento pessoal de mídia, inspirada no MyAnimeList. O sistema tem duas partes:
- `frontend/` — React + Vite + TypeScript (CSS Modules, sem bibliotecas de UI)
- `backend/` — Node.js + Express + TypeScript + SQLite

O frontend se comunica exclusivamente com o backend via API REST (usando Axios). Nenhum dado é persistido no cliente. O frontend **nunca** consome a API do AniList diretamente — toda comunicação externa é feita pelo backend.

Nesta primeira versão, apenas a seção **Anime** é funcional. As seções Filmes, Séries, Livros e Jogos existem na navegação mas exibem apenas uma mensagem de "em breve".

Não há autenticação, login ou múltiplos usuários. A aplicação é de uso local e pessoal.

---

## 1. Idioma e Comentários
- **Código em Inglês:** Variáveis, funções, tipos, interfaces, arquivos, pastas, hooks, utils, constantes e classes CSS.
- **Texto Visível em Português:** Labels, placeholders, mensagens, títulos e qualquer texto renderizado para o usuário.
- **Zero Comentários:** O código deve ser limpo e autoexplicativo através de nomes significativos (Clean Code). Não adicione comentários no código final.

## 2. Stack Técnica e Restrições
- **React 18+ com TypeScript:** Modo estrito ativado (`strict: true`). Proibido o uso de `any` e `eslint-disable`.
- **Estilização:** Apenas CSS Modules Vanilla (`.module.css`). Nenhuma biblioteca de UI externa (Tailwind, MUI, etc).
- **Gerenciamento de Estado:** Apenas ferramentas nativas do React (`useState`, `useReducer`, `useContext`). Nenhum Redux, Zustand ou afins.
- **Roteamento:** React Router para navegação entre seções (Anime, Filmes, Séries, Livros, Jogos).
- **HTTP Client:** Axios para todas as chamadas ao backend.
- **Build Tool:** Vite.

## 3. Padrões de Código e Arquitetura
- **Clean Code:** Funções pequenas, focadas e com responsabilidade única.
- **Estrutura de Componentes:** Cada componente deve ter sua própria pasta contendo o `.tsx` e o `.module.css`.
- **Separação de Responsabilidades:**
  - Lógica de domínio isolada em funções puras na pasta `utils/`.
  - Chamadas HTTP centralizadas na pasta `services/` (ex: `animeService.ts`, `libraryService.ts`).
  - Lógica de estado e integração isolada em Custom Hooks na pasta `hooks/` (ex: `useAnime.ts`, `useLibrary.ts`).
  - Definições de TypeScript centralizadas na pasta `types/` (ex: `anime.ts`, `library.ts`).

## 4. Estrutura de Pastas
```
frontend/
  src/
    components/
      Sidebar/
      AnimeCard/
      AnimeDrawer/
      AnimeGrid/
      SearchBar/
      TabNav/
      ...
    pages/
      AnimePage/
      MoviesPage/
      SeriesPage/
      BooksPage/
      GamesPage/
    services/
      animeService.ts    ← chamadas ao backend (/api/anime/*)
      libraryService.ts  ← chamadas ao backend (/api/library/*)
    hooks/
      useAnime.ts
      useLibrary.ts
      useDebounce.ts
    types/
      anime.ts
      library.ts
    styles/
      global.css         ← variáveis CSS globais (cores, espaçamentos, tipografia)
    App.tsx
    main.tsx
```

## 5. UI, UX e Acessibilidade (A11y)
- **Dark Mode como padrão:** O tema escuro é o tema principal. Variáveis de cor definidas no `global.css`.
- **Acessibilidade:** Todos os elementos interativos (botões, cards, inputs) devem ser acessíveis via teclado (`tabIndex`, `onKeyDown` para `Enter` e `Espaço`).
- **Nomenclatura CSS:** Utilizar `camelCase` para nomes de classes nos arquivos `.module.css`.
- **Design System:** Basear-se em variáveis CSS globais definidas no `global.css` (cores, espaçamentos, transições e tipografia).
- **Console Limpo:** Nenhum `console.log` deve ser deixado no código final.
- **Loading States:** Toda chamada assíncrona deve exibir um estado de carregamento.
- **Empty States:** Listas vazias devem exibir mensagens amigáveis.
- **Tratamento de Erros:** Erros de rede devem ser exibidos de forma clara ao usuário.

## 6. Componentes-Chave

### Sidebar
- Fixa à esquerda.
- Itens: Anime, Filmes, Séries, Livros, Jogos.
- Apenas Anime é funcional; os demais levam a páginas com mensagem "Funcionalidade será implementada futuramente."

### Cards de Anime
- Exibem: capa, título, status (Em exibição / Finalizado), episódios (atual/total), ícones de streaming (quando disponíveis), botão para adicionar à biblioteca.
- Interface limpa — evitar excesso de informações.
- Hover com animação suave.

### Drawer de Detalhes
- Abre ao clicar em um card, **sem navegar para outra página**.
- Exibe: banner, capa, título, trailer, descrição, status, episódios, próximo episódio + data, gêneros, estúdio, nota média, plataformas de streaming.
- Controles pessoais: Status, Nota, Progresso.
- Animação de entrada/saída lateral.

### Abas da Página Anime
- Temporada Atual, Próxima Temporada, Mais Populares, Buscar, Minha Biblioteca.

## 7. Evolução destas Regras (Nota para a IA)
- **Atualização Contínua:** Se você (a IA) identificar um novo padrão importante, restrição não documentada ou regra útil durante o desenvolvimento, **adicione a este arquivo**.
- **Seja Conciso:** Mantenha as adições curtas e diretas. Este arquivo é sua memória do projeto.
