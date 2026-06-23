import { cachedRequest } from "../lib/httpClient.js";
import type {
  TmdbTvListItem,
  TmdbTvDetail,
  TmdbListResponse,
  SeriesCard,
  SeriesDetail,
  SeriesListResult,
  SeriesPageInfo,
  WatchProvider,
} from "../types/series.js";

const TMDB_URL = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 60 * 60 * 1000;
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w1280";
const LOGO_SIZE = "w92";

function buildImage(path: string | null, size: string): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

function deriveStatus(firstAirDate: string | null): string {
  if (!firstAirDate) return "UPCOMING";
  const today = new Date().toISOString().slice(0, 10);
  return firstAirDate <= today ? "RELEASED" : "UPCOMING";
}

function toSeriesCard(series: TmdbTvListItem): SeriesCard {
  return {
    id: series.id,
    title: series.name,
    posterImage: buildImage(series.poster_path, POSTER_SIZE) ?? "",
    backdropImage: buildImage(series.backdrop_path, BACKDROP_SIZE),
    firstAirDate: series.first_air_date || null,
    voteAverage: series.vote_average,
    overview: series.overview || null,
    seriesStatus: deriveStatus(series.first_air_date || null),
  };
}

function toSeriesDetail(series: TmdbTvDetail): SeriesDetail {
  const trailer = (series.videos?.results ?? []).find(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );

  const flatrate = series["watch/providers"]?.results?.BR?.flatrate ?? [];
  const watchProviders: WatchProvider[] = flatrate.map((p) => ({
    name: p.provider_name,
    logo: buildImage(p.logo_path, LOGO_SIZE),
  }));

  return {
    ...toSeriesCard(series),
    seasons: series.number_of_seasons,
    episodes: series.number_of_episodes,
    genres: series.genres.map((g) => g.name),
    tagline: series.tagline || null,
    airStatus: series.status || null,
    trailerKey: trailer?.key ?? null,
    watchProviders,
    voteCount: series.vote_count,
  };
}

function toPageInfo(data: TmdbListResponse): SeriesPageInfo {
  return {
    total: data.total_results,
    currentPage: data.page,
    lastPage: data.total_pages,
    hasNextPage: data.page < data.total_pages,
  };
}

async function queryTmdb<T>(path: string, params: Record<string, unknown>): Promise<T> {
  return cachedRequest<T>(
    { url: `${TMDB_URL}${path}`, params: { api_key: process.env.TMDB_API_KEY, language: "pt-BR", ...params } },
    CACHE_TTL_MS
  );
}

export async function fetchPopularSeries(year: number, month: number | undefined, page = 1): Promise<SeriesListResult> {
  const mm = month ? String(month).padStart(2, "0") : "";
  const gte = month ? `${year}-${mm}-01` : `${year}-01-01`;
  const lte = month ? `${year}-${mm}-${new Date(year, month, 0).getDate()}` : `${year}-12-31`;
  const data = await queryTmdb<TmdbListResponse>("/discover/tv", {
    sort_by: "vote_count.desc",
    "first_air_date.gte": gte,
    "first_air_date.lte": lte,
    page,
  });
  return { series: data.results.map(toSeriesCard), pageInfo: toPageInfo(data) };
}

export async function searchSeries(searchQuery: string, page = 1): Promise<SeriesListResult> {
  const data = await queryTmdb<TmdbListResponse>("/search/tv", { query: searchQuery, page });
  return { series: data.results.map(toSeriesCard), pageInfo: toPageInfo(data) };
}

export async function fetchSeriesById(id: number): Promise<SeriesDetail> {
  const data = await queryTmdb<TmdbTvDetail>(`/tv/${id}`, {
    append_to_response: "videos,watch/providers",
  });
  return toSeriesDetail(data);
}

export interface SeriesSyncResult {
  episodes: number | null;
  airStatus: string | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

export async function fetchSeriesSyncData(id: number): Promise<SeriesSyncResult> {
  const data = await queryTmdb<TmdbTvDetail>(`/tv/${id}`, {});
  const next = data.next_episode_to_air ?? null;
  const nextAiringEpisode =
    next && next.air_date
      ? { episode: next.episode_number, airingAt: Math.floor(new Date(`${next.air_date}T12:00:00Z`).getTime() / 1000) }
      : null;
  return {
    episodes: data.number_of_episodes,
    airStatus: data.status,
    nextAiringEpisode,
  };
}
