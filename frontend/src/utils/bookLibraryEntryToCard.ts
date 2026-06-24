import type { BookCard } from "../types/book";
import type { BookLibraryEntry } from "../types/bookLibrary";

export function bookLibraryEntryToCard(entry: BookLibraryEntry): BookCard {
  return {
    id: entry.googleBooksId,
    title: entry.title,
    coverImage: entry.coverImage,
    authors: entry.authors ? entry.authors.split(", ") : [],
    publishedDate: entry.publishedDate,
    averageRating: null,
    ratingsCount: null,
  };
}
