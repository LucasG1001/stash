import { useState, useCallback, useEffect } from "react";
import type { GameLibraryEntry, CreateGameLibraryEntry, UpdateGameLibraryEntry } from "../types/gameLibrary";
import { fetchLibrary, addToLibrary, updateLibraryEntry, removeFromLibrary } from "../services/gameLibraryService";

interface UseGameLibraryReturn {
  entries: GameLibraryEntry[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (entry: CreateGameLibraryEntry) => Promise<GameLibraryEntry | null>;
  update: (id: string, data: UpdateGameLibraryEntry) => Promise<GameLibraryEntry | null>;
  remove: (id: string) => Promise<boolean>;
  findByRawgId: (rawgId: number) => GameLibraryEntry | undefined;
}

export function useGameLibrary(): UseGameLibraryReturn {
  const [entries, setEntries] = useState<GameLibraryEntry[]>([]);
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

  const add = useCallback(async (entry: CreateGameLibraryEntry): Promise<GameLibraryEntry | null> => {
    try {
      const created = await addToLibrary(entry);
      setEntries((prev) => [created, ...prev]);
      return created;
    } catch {
      setError("Erro ao adicionar jogo à biblioteca.");
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, data: UpdateGameLibraryEntry): Promise<GameLibraryEntry | null> => {
    try {
      const updated = await updateLibraryEntry(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch {
      setError("Erro ao atualizar jogo.");
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await removeFromLibrary(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch {
      setError("Erro ao remover jogo da biblioteca.");
      return false;
    }
  }, []);

  const findByRawgId = useCallback((rawgId: number): GameLibraryEntry | undefined => {
    return entries.find((e) => e.rawgId === rawgId);
  }, [entries]);

  return { entries, loading, error, load, add, update, remove, findByRawgId };
}
