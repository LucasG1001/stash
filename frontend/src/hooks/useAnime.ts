import { useCallback } from "react";
import { useMediaList } from "./useMediaList";
import type { AnimeCard } from "../types/anime";
import { fetchSeason, fetchPopular, searchAnimes } from "../services/animeService";

export function useAnime() {
  const { items, loading, error, hasNextPage, load, loadMore, reset } = useMediaList<AnimeCard>(
    "Erro ao carregar animes. Tente novamente."
  );

  const loadSeason = useCallback((season?: string, year?: number) =>
    load(`season:${season ?? "current"}:${year ?? ""}`, (p, signal) =>
      fetchSeason(season, year, p, signal).then((r) => ({ items: r.animes, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const loadPopular = useCallback((year?: number) =>
    load(`popular:${year ?? "all"}`, (p, signal) =>
      fetchPopular(year, p, signal).then((r) => ({ items: r.animes, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const search = useCallback((query: string) =>
    load(`search:${query}`, (p, signal) =>
      searchAnimes(query, p, signal).then((r) => ({ items: r.animes, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  return { animes: items, loading, error, hasNextPage, loadSeason, loadPopular, search, loadMore, reset };
}
