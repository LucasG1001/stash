import { useState, useCallback, useRef } from "react";
import type { MovieCard, MovieListResponse } from "../types/movie";
import { fetchPopular, fetchNowPlaying, searchMovies } from "../services/movieService";

interface UseMoviesReturn {
  movies: MovieCard[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadPopular: () => Promise<void>;
  loadNowPlaying: () => Promise<void>;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

type FetchFunction = (page?: number) => Promise<MovieListResponse>;

interface CacheEntry {
  movies: MovieCard[];
  page: number;
  hasNextPage: boolean;
}

export function useMovies(): UseMoviesReturn {
  const [movies, setMovies] = useState<MovieCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const currentKey = useRef<string | null>(null);
  const currentFetch = useRef<FetchFunction | null>(null);

  const applyEntry = useCallback((entry: CacheEntry) => {
    setMovies(entry.movies);
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
        movies: result.movies,
        page: 1,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, entry);
      if (currentKey.current === key) applyEntry(entry);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar filmes. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [applyEntry]);

  const loadPopular = useCallback(() => {
    return load("popular", (p) => fetchPopular(p));
  }, [load]);

  const loadNowPlaying = useCallback(() => {
    return load("now_playing", (p) => fetchNowPlaying(p));
  }, [load]);

  const search = useCallback((query: string) => {
    return load(`search:${query}`, (p) => searchMovies(query, p));
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
        movies: [...entry.movies, ...result.movies],
        page: nextPage,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, updated);
      if (currentKey.current === key) applyEntry(updated);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar filmes. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [loading, applyEntry]);

  return { movies, loading, error, hasNextPage, loadPopular, loadNowPlaying, search, loadMore };
}
