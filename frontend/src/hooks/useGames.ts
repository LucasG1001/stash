import { useState, useCallback, useRef } from "react";
import type { GameCard, GameListResponse } from "../types/game";
import { fetchPopular, fetchUpcoming, searchGames } from "../services/gameService";

interface UseGamesReturn {
  games: GameCard[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadPopular: (month: number, year: number) => Promise<void>;
  loadUpcoming: () => Promise<void>;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

type FetchFunction = (page?: number) => Promise<GameListResponse>;

interface CacheEntry {
  games: GameCard[];
  page: number;
  hasNextPage: boolean;
}

export function useGames(): UseGamesReturn {
  const [games, setGames] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const currentKey = useRef<string | null>(null);
  const currentFetch = useRef<FetchFunction | null>(null);

  const applyEntry = useCallback((entry: CacheEntry) => {
    setGames(entry.games);
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
        games: result.games,
        page: 1,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, entry);
      if (currentKey.current === key) applyEntry(entry);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar jogos. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [applyEntry]);

  const loadPopular = useCallback((month: number, year: number) => {
    return load(`popular:${month}:${year}`, (p) => fetchPopular(month, year, p));
  }, [load]);

  const loadUpcoming = useCallback(() => {
    return load("upcoming", (p) => fetchUpcoming(p));
  }, [load]);

  const search = useCallback((query: string) => {
    return load(`search:${query}`, (p) => searchGames(query, p));
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
        games: [...entry.games, ...result.games],
        page: nextPage,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, updated);
      if (currentKey.current === key) applyEntry(updated);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar jogos. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [loading, applyEntry]);

  return { games, loading, error, hasNextPage, loadPopular, loadUpcoming, search, loadMore };
}
