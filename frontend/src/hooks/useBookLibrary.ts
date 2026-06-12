import { useLibraryStore } from "../context/libraryStore";
import * as bookLibraryService from "../services/bookLibraryService";
import type { BookLibraryEntry, CreateBookLibraryEntry, UpdateBookLibraryEntry } from "../types/bookLibrary";

export function useBookLibrary() {
  const store = useLibraryStore<BookLibraryEntry, CreateBookLibraryEntry, UpdateBookLibraryEntry>(
    "book",
    bookLibraryService,
    (entry) => entry.googleBooksId
  );
  return { ...store, findByGoogleBooksId: store.findByExternalId };
}
