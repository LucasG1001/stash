import { useState, useCallback, useRef } from "react";
import type { AnimeCard, AnimeListResponse } from "../types/anime";
import { fetchSeason, fetchPopular, searchAnimes } from "../services/animeService";

interface UseAnimeReturn {
  animes: AnimeCard[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadSeason: (season?: string, year?: number) => Promise<void>;
  loadPopular: () => Promise<void>;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

type FetchFunction = (page?: number) => Promise<AnimeListResponse>;

interface CacheEntry {
  animes: AnimeCard[];
  page: number;
  hasNextPage: boolean;
}

export function useAnime(): UseAnimeReturn {
  const [animes, setAnimes] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const currentKey = useRef<string | null>(null);
  const currentFetch = useRef<FetchFunction | null>(null);

  const applyEntry = useCallback((entry: CacheEntry) => {
    setAnimes(entry.animes);
    setHasNextPage(entry.hasNextPage);
  }, []);

  const load = useCallback(async (key: string, fetchFn: FetchFunction) => {
    currentKey.current = key;
    currentFetch.current = fetchFn;

    const cached = cache.current.get(key);
    if (cached) {
      setError(null);
      setLoading(false);
      applyEntry(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(1);
      const entry: CacheEntry = {
        animes: result.animes,
        page: 1,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, entry);
      if (currentKey.current === key) applyEntry(entry);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar animes. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [applyEntry]);

  const loadSeason = useCallback((season?: string, year?: number) => {
    return load(`season:${season ?? "current"}:${year ?? ""}`, (p) => fetchSeason(season, year, p));
  }, [load]);

  const loadPopular = useCallback(() => {
    return load("popular", (p) => fetchPopular(p));
  }, [load]);

  const search = useCallback((query: string) => {
    return load(`search:${query}`, (p) => searchAnimes(query, p));
  }, [load]);

  const loadMore = useCallback(async () => {
    const key = currentKey.current;
    const fetchFn = currentFetch.current;
    if (!key || !fetchFn || loading) return;

    const entry = cache.current.get(key);
    if (!entry || !entry.hasNextPage) return;

    setLoading(true);
    try {
      const nextPage = entry.page + 1;
      const result = await fetchFn(nextPage);
      const updated: CacheEntry = {
        animes: [...entry.animes, ...result.animes],
        page: nextPage,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, updated);
      if (currentKey.current === key) applyEntry(updated);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar animes. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [loading, applyEntry]);

  return { animes, loading, error, hasNextPage, loadSeason, loadPopular, search, loadMore };
}
