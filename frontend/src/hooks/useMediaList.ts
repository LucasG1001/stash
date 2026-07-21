import { useState, useCallback, useRef } from "react";
import axios from "axios";

export interface MediaPage<TItem> {
  items: TItem[];
  hasNextPage: boolean;
}

type FetchFunction<TItem> = (page: number, signal?: AbortSignal) => Promise<MediaPage<TItem>>;

interface CacheEntry<TItem> {
  items: TItem[];
  page: number;
  hasNextPage: boolean;
}

export interface MediaList<TItem> {
  items: TItem[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  load: (key: string, fetchFn: FetchFunction<TItem>) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useMediaList<TItem>(errorMessage: string): MediaList<TItem> {
  const [items, setItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cache = useRef<Map<string, CacheEntry<TItem>>>(new Map());
  const currentKey = useRef<string | null>(null);
  const currentFetch = useRef<FetchFunction<TItem> | null>(null);
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const applyEntry = useCallback((entry: CacheEntry<TItem>) => {
    setItems(entry.items);
    setHasNextPage(entry.hasNextPage);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    currentKey.current = null;
    currentFetch.current = null;
    loadingRef.current = false;
    setItems([]);
    setHasNextPage(false);
    setError(null);
    setLoading(false);
  }, []);

  const load = useCallback(async (key: string, fetchFn: FetchFunction<TItem>) => {
    abortRef.current?.abort();
    currentKey.current = key;
    currentFetch.current = fetchFn;

    const cached = cache.current.get(key);
    if (cached) {
      abortRef.current = null;
      loadingRef.current = false;
      setError(null);
      setLoading(false);
      applyEntry(cached);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const result = await fetchFn(1, controller.signal);
      const entry: CacheEntry<TItem> = { items: result.items, page: 1, hasNextPage: result.hasNextPage };
      cache.current.set(key, entry);
      if (currentKey.current === key) applyEntry(entry);
    } catch (err) {
      if (axios.isCancel(err)) return;
      if (currentKey.current === key) setError(errorMessage);
    } finally {
      if (abortRef.current === controller) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [applyEntry, errorMessage]);

  const loadMore = useCallback(async () => {
    const key = currentKey.current;
    const fetchFn = currentFetch.current;
    if (!key || !fetchFn || loadingRef.current) return;

    const entry = cache.current.get(key);
    if (!entry || !entry.hasNextPage) return;

    const controller = new AbortController();
    abortRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    try {
      const nextPage = entry.page + 1;
      const result = await fetchFn(nextPage, controller.signal);
      const updated: CacheEntry<TItem> = {
        items: [...entry.items, ...result.items],
        page: nextPage,
        hasNextPage: result.hasNextPage,
      };
      cache.current.set(key, updated);
      if (currentKey.current === key) applyEntry(updated);
    } catch (err) {
      if (axios.isCancel(err)) return;
      if (currentKey.current === key) setError(errorMessage);
    } finally {
      if (abortRef.current === controller) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [applyEntry, errorMessage]);

  return { items, loading, error, hasNextPage, load, loadMore, reset };
}
