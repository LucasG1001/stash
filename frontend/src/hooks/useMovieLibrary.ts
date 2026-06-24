import { useLibraryStore } from "../context/libraryStore";
import * as movieLibraryService from "../services/movieLibraryService";
import type { MovieLibraryEntry, CreateMovieLibraryEntry, UpdateMovieLibraryEntry } from "../types/movieLibrary";

export function useMovieLibrary() {
  const store = useLibraryStore<MovieLibraryEntry, CreateMovieLibraryEntry, UpdateMovieLibraryEntry>(
    "movie",
    movieLibraryService,
    (entry) => entry.tmdbId,
    (entry) => entry.collectionId
  );
  return { ...store, findByTmdbId: store.findByExternalId };
}
