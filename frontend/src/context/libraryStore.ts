import { createContext, useContext, useCallback, useEffect } from "react";

export interface Slice {
  entries: unknown[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

export type Store = Record<string, Slice>;

export interface LibraryContextValue {
  store: Store;
  setSlice: (media: string, updater: (prev: Slice) => Slice) => void;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);

export const EMPTY_SLICE: Slice = { entries: [], loading: true, error: null, loaded: false };

const inFlight = new Set<string>();

export interface LibraryService<TEntry, TCreate, TUpdate> {
  fetchLibrary: () => Promise<TEntry[]>;
  addToLibrary: (entry: TCreate) => Promise<TEntry | TEntry[]>;
  updateLibraryEntry: (id: string, data: TUpdate) => Promise<TEntry>;
  removeFromLibrary: (id: string) => Promise<void>;
}

export interface LibraryStore<TEntry, TCreate, TUpdate> {
  entries: TEntry[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (entry: TCreate) => Promise<TEntry | null>;
  update: (id: string, data: TUpdate) => Promise<TEntry | null>;
  remove: (id: string) => Promise<boolean>;
  findByExternalId: (externalId: number | string) => TEntry | undefined;
}

export function useLibraryStore<TEntry extends { id: string }, TCreate, TUpdate>(
  media: string,
  service: LibraryService<TEntry, TCreate, TUpdate>,
  getExternalId: (entry: TEntry) => number | string
): LibraryStore<TEntry, TCreate, TUpdate> {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibraryStore requer o LibraryProvider.");
  const { store, setSlice } = ctx;
  const slice = store[media] ?? EMPTY_SLICE;
  const entries = slice.entries as TEntry[];

  const load = useCallback(async () => {
    setSlice(media, (p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await service.fetchLibrary();
      setSlice(media, (p) => ({ ...p, entries: data, loaded: true, loading: false }));
    } catch {
      setSlice(media, (p) => ({ ...p, error: "Erro ao carregar biblioteca.", loading: false }));
    }
  }, [media, service, setSlice]);

  useEffect(() => {
    if (slice.loaded || inFlight.has(media)) return;
    inFlight.add(media);
    setSlice(media, (p) => ({ ...p, loading: true, error: null }));
    service.fetchLibrary()
      .then((data) => setSlice(media, (p) => ({ ...p, entries: data, loaded: true, loading: false })))
      .catch(() => setSlice(media, (p) => ({ ...p, error: "Erro ao carregar biblioteca.", loading: false })))
      .finally(() => inFlight.delete(media));
  }, [media, slice.loaded, service, setSlice]);

  const add = useCallback(async (entry: TCreate): Promise<TEntry | null> => {
    try {
      const created = await service.addToLibrary(entry);
      const list = Array.isArray(created) ? created : [created];
      setSlice(media, (p) => {
        const ids = new Set(list.map((e) => e.id));
        const kept = (p.entries as TEntry[]).filter((e) => !ids.has(e.id));
        return { ...p, entries: [...list, ...kept] };
      });
      return list[0] ?? null;
    } catch {
      setSlice(media, (p) => ({ ...p, error: "Erro ao adicionar à biblioteca." }));
      return null;
    }
  }, [media, service, setSlice]);

  const update = useCallback(async (id: string, data: TUpdate): Promise<TEntry | null> => {
    try {
      const updated = await service.updateLibraryEntry(id, data);
      setSlice(media, (p) => ({ ...p, entries: (p.entries as TEntry[]).map((e) => (e.id === id ? updated : e)) }));
      return updated;
    } catch {
      setSlice(media, (p) => ({ ...p, error: "Erro ao atualizar item." }));
      return null;
    }
  }, [media, service, setSlice]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await service.removeFromLibrary(id);
      setSlice(media, (p) => ({ ...p, entries: (p.entries as TEntry[]).filter((e) => e.id !== id) }));
      return true;
    } catch {
      setSlice(media, (p) => ({ ...p, error: "Erro ao remover da biblioteca." }));
      return false;
    }
  }, [media, service, setSlice]);

  const findByExternalId = useCallback(
    (externalId: number | string): TEntry | undefined => entries.find((e) => getExternalId(e) === externalId),
    [entries, getExternalId]
  );

  return { entries, loading: slice.loading, error: slice.error, load, add, update, remove, findByExternalId };
}
