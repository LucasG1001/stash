import { useState, useCallback, useRef } from "react";
import type { BookCard, BookListResponse } from "../types/book";
import { fetchByGenre, searchBooks } from "../services/bookService";

interface UseBooksReturn {
  books: BookCard[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadByGenre: (genre: string) => Promise<void>;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

type FetchFunction = (page?: number) => Promise<BookListResponse>;

interface CacheEntry {
  books: BookCard[];
  page: number;
  hasNextPage: boolean;
}

export function useBooks(): UseBooksReturn {
  const [books, setBooks] = useState<BookCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const currentKey = useRef<string | null>(null);
  const currentFetch = useRef<FetchFunction | null>(null);

  const applyEntry = useCallback((entry: CacheEntry) => {
    setBooks(entry.books);
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
    setBooks([]);
    try {
      const result = await fetchFn(1);
      const entry: CacheEntry = {
        books: result.books,
        page: 1,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, entry);
      if (currentKey.current === key) applyEntry(entry);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar livros. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [applyEntry]);

  const loadByGenre = useCallback((genre: string) => {
    return load(`genre:${genre}`, (p) => fetchByGenre(genre, p));
  }, [load]);

  const search = useCallback((query: string) => {
    return load(`search:${query}`, (p) => searchBooks(query, p));
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
        books: [...entry.books, ...result.books],
        page: nextPage,
        hasNextPage: result.pageInfo.hasNextPage,
      };
      cache.current.set(key, updated);
      if (currentKey.current === key) applyEntry(updated);
    } catch {
      if (currentKey.current === key) setError("Erro ao carregar livros. Tente novamente.");
    } finally {
      if (currentKey.current === key) setLoading(false);
    }
  }, [loading, applyEntry]);

  return { books, loading, error, hasNextPage, loadByGenre, search, loadMore };
}
