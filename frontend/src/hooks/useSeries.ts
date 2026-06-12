import { useState, useCallback, useRef } from "react";
import type { SeriesCard, SeriesListResponse } from "../types/series";
import { fetchPopular, searchSeries } from "../services/seriesService";

interface UseSeriesReturn {
  series: SeriesCard[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadPopular: (month: number, year: number) => Promise<void>;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

type FetchFunction = (page?: number) => Promise<SeriesListResponse>;

interface CacheEntry {
  series: SeriesCard[];
  page: number;
  hasNextPage: boolean;
}

export function useSeries(): UseSeriesReturn {
  const [series, setSeries] = useState<SeriesCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const currentKey = useRef<string | null>(null);
  const currentFetch = useRef<FetchFunction | null>(null);

  const applyEntry = useCallback((entry: CacheEntry) => {
    setSeries(entry.series);
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
    setSeries([]);
    try {
      const result = await fetchFn(1);
      const entry: CacheEntry = {
        series: result.series,
        page: 1,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, entry);
      if (currentKey.current === key) applyEntry(entry);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar séries. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [applyEntry]);

  const loadPopular = useCallback((month: number, year: number) => {
    return load(`popular:${month}:${year}`, (p) => fetchPopular(month, year, p));
  }, [load]);

  const search = useCallback((query: string) => {
    return load(`search:${query}`, (p) => searchSeries(query, p));
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
        series: [...entry.series, ...result.series],
        page: nextPage,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, updated);
      if (currentKey.current === key) applyEntry(updated);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar séries. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [loading, applyEntry]);

  return { series, loading, error, hasNextPage, loadPopular, search, loadMore };
}
