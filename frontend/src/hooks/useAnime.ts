import { useState, useCallback } from "react";
import type { AnimeCard, AnimeListResponse } from "../types/anime";
import { fetchSeason, fetchPopular, searchAnimes } from "../services/animeService";

interface UseAnimeReturn {
  animes: AnimeCard[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadSeason: (season?: string, year?: number, page?: number) => Promise<void>;
  loadPopular: (page?: number) => Promise<void>;
  search: (query: string, page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
}

type FetchFunction = (page?: number) => Promise<AnimeListResponse>;

export function useAnime(): UseAnimeReturn {
  const [animes, setAnimes] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFetch, setCurrentFetch] = useState<FetchFunction | null>(null);

  const executeFetch = useCallback(async (fetchFn: FetchFunction, page: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(page);
      setAnimes((prev) => (append ? [...prev, ...result.animes] : result.animes));
      setHasNextPage(result.pageInfo.hasNextPage);
      setCurrentPage(page);
      setCurrentFetch(() => fetchFn);
    } catch {
      setError("Erro ao carregar animes. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSeason = useCallback(async (season?: string, year?: number, page = 1) => {
    const fetchFn = (p?: number) => fetchSeason(season, year, p);
    await executeFetch(fetchFn, page, false);
  }, [executeFetch]);

  const loadPopular = useCallback(async (page = 1) => {
    await executeFetch(fetchPopular, page, false);
  }, [executeFetch]);

  const search = useCallback(async (query: string, page = 1) => {
    const searchFn = (p?: number) => searchAnimes(query, p);
    await executeFetch(searchFn, page, false);
  }, [executeFetch]);

  const loadMore = useCallback(async () => {
    if (currentFetch && hasNextPage && !loading) {
      await executeFetch(currentFetch, currentPage + 1, true);
    }
  }, [currentFetch, hasNextPage, loading, currentPage, executeFetch]);

  return { animes, loading, error, hasNextPage, loadSeason, loadPopular, search, loadMore };
}
