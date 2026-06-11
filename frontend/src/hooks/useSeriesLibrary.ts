import { useState, useCallback, useEffect } from "react";
import type { SeriesLibraryEntry, CreateSeriesLibraryEntry, UpdateSeriesLibraryEntry } from "../types/seriesLibrary";
import { fetchLibrary, addToLibrary, updateLibraryEntry, removeFromLibrary } from "../services/seriesLibraryService";

interface UseSeriesLibraryReturn {
  entries: SeriesLibraryEntry[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (entry: CreateSeriesLibraryEntry) => Promise<SeriesLibraryEntry | null>;
  update: (id: string, data: UpdateSeriesLibraryEntry) => Promise<SeriesLibraryEntry | null>;
  remove: (id: string) => Promise<boolean>;
  findByTmdbId: (tmdbId: number) => SeriesLibraryEntry | undefined;
}

export function useSeriesLibrary(): UseSeriesLibraryReturn {
  const [entries, setEntries] = useState<SeriesLibraryEntry[]>([]);
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

  const add = useCallback(async (entry: CreateSeriesLibraryEntry): Promise<SeriesLibraryEntry | null> => {
    try {
      const created = await addToLibrary(entry);
      setEntries((prev) => [created, ...prev]);
      return created;
    } catch {
      setError("Erro ao adicionar série à biblioteca.");
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, data: UpdateSeriesLibraryEntry): Promise<SeriesLibraryEntry | null> => {
    try {
      const updated = await updateLibraryEntry(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch {
      setError("Erro ao atualizar série.");
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await removeFromLibrary(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch {
      setError("Erro ao remover série da biblioteca.");
      return false;
    }
  }, []);

  const findByTmdbId = useCallback((tmdbId: number): SeriesLibraryEntry | undefined => {
    return entries.find((e) => e.tmdbId === tmdbId);
  }, [entries]);

  return { entries, loading, error, load, add, update, remove, findByTmdbId };
}
