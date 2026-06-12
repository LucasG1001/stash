import { useState, useCallback, useEffect } from "react";
import type { BookLibraryEntry, CreateBookLibraryEntry, UpdateBookLibraryEntry } from "../types/bookLibrary";
import { fetchLibrary, addToLibrary, updateLibraryEntry, removeFromLibrary } from "../services/bookLibraryService";

interface UseBookLibraryReturn {
  entries: BookLibraryEntry[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (entry: CreateBookLibraryEntry) => Promise<BookLibraryEntry | null>;
  update: (id: string, data: UpdateBookLibraryEntry) => Promise<BookLibraryEntry | null>;
  remove: (id: string) => Promise<boolean>;
  findByGoogleBooksId: (googleBooksId: string) => BookLibraryEntry | undefined;
}

export function useBookLibrary(): UseBookLibraryReturn {
  const [entries, setEntries] = useState<BookLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLibrary();
      setEntries(data);
    } catch {
      setError("Erro ao carregar biblioteca.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchLibrary()
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch(() => { if (!cancelled) setError("Erro ao carregar biblioteca."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const add = useCallback(async (entry: CreateBookLibraryEntry): Promise<BookLibraryEntry | null> => {
    try {
      const created = await addToLibrary(entry);
      setEntries((prev) => [created, ...prev]);
      return created;
    } catch {
      setError("Erro ao adicionar livro à biblioteca.");
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, data: UpdateBookLibraryEntry): Promise<BookLibraryEntry | null> => {
    try {
      const updated = await updateLibraryEntry(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch {
      setError("Erro ao atualizar livro.");
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await removeFromLibrary(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch {
      setError("Erro ao remover livro da biblioteca.");
      return false;
    }
  }, []);

  const findByGoogleBooksId = useCallback((googleBooksId: string): BookLibraryEntry | undefined => {
    return entries.find((e) => e.googleBooksId === googleBooksId);
  }, [entries]);

  return { entries, loading, error, load, add, update, remove, findByGoogleBooksId };
}
