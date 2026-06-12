import { useLibraryStore } from "../context/libraryStore";
import * as seriesLibraryService from "../services/seriesLibraryService";
import type { SeriesLibraryEntry, CreateSeriesLibraryEntry, UpdateSeriesLibraryEntry } from "../types/seriesLibrary";

export function useSeriesLibrary() {
  const store = useLibraryStore<SeriesLibraryEntry, CreateSeriesLibraryEntry, UpdateSeriesLibraryEntry>(
    "series",
    seriesLibraryService,
    (entry) => entry.tmdbId
  );
  return { ...store, findByTmdbId: store.findByExternalId };
}
