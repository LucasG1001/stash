import { cachedRequest } from "../lib/httpClient.js";
import type {
  RawgGameListItem,
  RawgGameDetail,
  RawgListResponse,
  RawgMoviesResponse,
  RawgScreenshotsResponse,
  RawgStoresResponse,
  GameCard,
  GameDetail,
  GameListResult,
  GamePageInfo,
  GameStore,
} from "../types/game.js";

const RAWG_URL = "https://api.rawg.io/api";
const PAGE_SIZE = 20;
const CACHE_TTL_MS = 60 * 60 * 1000;

function proxify(url: string | null): string | null {
  return url ? `/api/game/media?url=${encodeURIComponent(url)}` : null;
}

function deriveStatus(released: string | null, tba: boolean): string {
  if (tba || !released) return "UPCOMING";
  const today = new Date().toISOString().slice(0, 10);
  return released <= today ? "RELEASED" : "UPCOMING";
}

function toGameCard(game: RawgGameListItem): GameCard {
  return {
    id: game.id,
    title: game.name,
    backgroundImage: proxify(game.background_image),
    released: game.released || null,
    rating: game.rating,
    metacritic: game.metacritic,
    gameStatus: deriveStatus(game.released || null, game.tba),
  };
}

function toPageInfo(data: RawgListResponse, page: number): GamePageInfo {
  return {
    total: data.count,
    currentPage: page,
    hasNextPage: !!data.next,
  };
}

async function queryRawg<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  return cachedRequest<T>(
    { url: `${RAWG_URL}${path}`, params: { key: process.env.RAWG_API_KEY, ...params } },
    CACHE_TTL_MS
  );
}

export async function fetchPopularGames(year: number, month: number | undefined, page = 1): Promise<GameListResult> {
  const mm = month ? String(month).padStart(2, "0") : "";
  const start = month ? `${year}-${mm}-01` : `${year}-01-01`;
  const end = month ? `${year}-${mm}-${new Date(year, month, 0).getDate()}` : `${year}-12-31`;
  const data = await queryRawg<RawgListResponse>("/games", {
    dates: `${start},${end}`,
    ordering: "-added",
    page,
    page_size: PAGE_SIZE,
  });
  return { games: data.results.map(toGameCard), pageInfo: toPageInfo(data, page) };
}

export async function fetchUpcomingGames(page = 1): Promise<GameListResult> {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  const data = await queryRawg<RawgListResponse>("/games", {
    dates: `${start},${end}`,
    ordering: "-added",
    page,
    page_size: PAGE_SIZE,
  });
  return { games: data.results.map(toGameCard), pageInfo: toPageInfo(data, page) };
}

export async function searchGames(searchQuery: string, page = 1): Promise<GameListResult> {
  const data = await queryRawg<RawgListResponse>("/games", {
    search: searchQuery,
    page,
    page_size: PAGE_SIZE,
  });
  return { games: data.results.map(toGameCard), pageInfo: toPageInfo(data, page) };
}

export async function fetchGameById(id: number): Promise<GameDetail> {
  const [detail, movies, screenshots, storeLinks] = await Promise.all([
    queryRawg<RawgGameDetail>(`/games/${id}`),
    queryRawg<RawgMoviesResponse>(`/games/${id}/movies`).catch(() => ({ results: [] })),
    queryRawg<RawgScreenshotsResponse>(`/games/${id}/screenshots`).catch(() => ({ results: [] })),
    queryRawg<RawgStoresResponse>(`/games/${id}/stores`).catch(() => ({ results: [] })),
  ]);

  const urlByStoreId = new Map<number, string>();
  for (const link of storeLinks.results) {
    if (link.url) urlByStoreId.set(link.store_id, link.url);
  }

  const stores: GameStore[] = (detail.stores ?? [])
    .map((s) => ({ name: s.store.name, url: urlByStoreId.get(s.store.id) ?? s.url }))
    .filter((s) => s.url);

  const movie = movies.results[0];
  const rawTrailerUrl = movie ? movie.data.max || movie.data[480] || "" : "";
  const trailer = rawTrailerUrl
    ? { url: proxify(rawTrailerUrl) ?? "", preview: proxify(movie.preview) }
    : null;

  return {
    ...toGameCard(detail),
    description: detail.description_raw || null,
    website: detail.website || null,
    developers: (detail.developers ?? []).map((d) => d.name),
    publishers: (detail.publishers ?? []).map((p) => p.name),
    platforms: (detail.platforms ?? []).map((p) => p.platform.name),
    genres: (detail.genres ?? []).map((g) => g.name),
    esrb: detail.esrb_rating?.name ?? null,
    stores,
    trailer: trailer && trailer.url ? trailer : null,
    screenshots: screenshots.results.map((s) => proxify(s.image)).filter((s): s is string => !!s),
    ratingsCount: detail.ratings_count,
  };
}
