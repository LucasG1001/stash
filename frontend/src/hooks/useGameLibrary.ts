import { useLibraryStore } from "../context/libraryStore";
import * as gameLibraryService from "../services/gameLibraryService";
import type { GameLibraryEntry, CreateGameLibraryEntry, UpdateGameLibraryEntry } from "../types/gameLibrary";

export function useGameLibrary() {
  const store = useLibraryStore<GameLibraryEntry, CreateGameLibraryEntry, UpdateGameLibraryEntry>(
    "game",
    gameLibraryService,
    (entry) => entry.igdbId
  );
  return { ...store, findByIgdbId: store.findByExternalId };
}
