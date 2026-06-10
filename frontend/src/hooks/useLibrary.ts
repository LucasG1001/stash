import { useState, useCallback, useEffect } from "react";
import type { LibraryEntry, CreateLibraryEntry, UpdateLibraryEntry } from "../types/library";
import { fetchLibrary, addToLibrary, updateLibraryEntry, removeFromLibrary } from "../services/libraryService";

interface UseLibraryReturn {
  entries: LibraryEntry[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (entry: CreateLibraryEntry) => Promise<LibraryEntry | null>;
  update: (id: string, data: UpdateLibraryEntry) => Promise<LibraryEntry | null>;
  remove: (id: string) => Promise<boolean>;
  findByAnilistId: (anilistId: number) => LibraryEntry | undefined;
}

export function useLibrary(): UseLibraryReturn {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
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
    load();
  }, [load]);

  const add = useCallback(async (entry: CreateLibraryEntry): Promise<LibraryEntry | null> => {
    try {
      const created = await addToLibrary(entry);
      setEntries((prev) => [created, ...prev]);
      return created;
    } catch {
      setError("Erro ao adicionar anime à biblioteca.");
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, data: UpdateLibraryEntry): Promise<LibraryEntry | null> => {
    try {
      const updated = await updateLibraryEntry(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch {
      setError("Erro ao atualizar anime.");
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await removeFromLibrary(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch {
      setError("Erro ao remover anime da biblioteca.");
      return false;
    }
  }, []);

  const findByAnilistId = useCallback((anilistId: number): LibraryEntry | undefined => {
    return entries.find((e) => e.anilistId === anilistId);
  }, [entries]);

  return { entries, loading, error, load, add, update, remove, findByAnilistId };
}
