import { useLibraryStore } from "../context/libraryStore";
import * as libraryService from "../services/libraryService";
import type { LibraryEntry, CreateLibraryEntry, UpdateLibraryEntry } from "../types/library";

export function useLibrary() {
  const store = useLibraryStore<LibraryEntry, CreateLibraryEntry, UpdateLibraryEntry>(
    "anime",
    libraryService,
    (entry) => entry.anilistId,
    (entry) => entry.franchiseId
  );
  return { ...store, findByAnilistId: store.findByExternalId };
}
