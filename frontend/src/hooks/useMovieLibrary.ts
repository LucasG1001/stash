import { useState, useCallback, useEffect } from "react";
import type { MovieLibraryEntry, CreateMovieLibraryEntry, UpdateMovieLibraryEntry } from "../types/movieLibrary";
import { fetchLibrary, addToLibrary, updateLibraryEntry, removeFromLibrary } from "../services/movieLibraryService";

interface UseMovieLibraryReturn {
  entries: MovieLibraryEntry[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (entry: CreateMovieLibraryEntry) => Promise<MovieLibraryEntry | null>;
  update: (id: string, data: UpdateMovieLibraryEntry) => Promise<MovieLibraryEntry | null>;
  remove: (id: string) => Promise<boolean>;
  findByTmdbId: (tmdbId: number) => MovieLibraryEntry | undefined;
}

export function useMovieLibrary(): UseMovieLibraryReturn {
  const [entries, setEntries] = useState<MovieLibraryEntry[]>([]);
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

  const add = useCallback(async (entry: CreateMovieLibraryEntry): Promise<MovieLibraryEntry | null> => {
    try {
      const created = await addToLibrary(entry);
      setEntries((prev) => [created, ...prev]);
      return created;
    } catch {
      setError("Erro ao adicionar filme à biblioteca.");
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, data: UpdateMovieLibraryEntry): Promise<MovieLibraryEntry | null> => {
    try {
      const updated = await updateLibraryEntry(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch {
      setError("Erro ao atualizar filme.");
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await removeFromLibrary(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch {
      setError("Erro ao remover filme da biblioteca.");
      return false;
    }
  }, []);

  const findByTmdbId = useCallback((tmdbId: number): MovieLibraryEntry | undefined => {
    return entries.find((e) => e.tmdbId === tmdbId);
  }, [entries]);

  return { entries, loading, error, load, add, update, remove, findByTmdbId };
}
