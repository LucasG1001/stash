import { createLibraryModel } from "../lib/createLibraryModel.js";
import type { BookLibraryEntry, CreateBookLibraryEntry, UpdateBookLibraryEntry } from "../types/bookLibrary.js";

export const bookLibraryModel = createLibraryModel<BookLibraryEntry, CreateBookLibraryEntry, UpdateBookLibraryEntry>({
  table: "books_library",
  externalId: { column: "google_books_id", field: "googleBooksId" },
  fields: [
    { column: "title", field: "title" },
    { column: "cover_image", field: "coverImage", default: null },
    { column: "authors", field: "authors", default: null },
    { column: "status", field: "status", default: "plan_to_read" },
    { column: "score", field: "score", default: 0, numeric: true },
    { column: "published_date", field: "publishedDate", default: null },
    { column: "page_count", field: "pageCount", default: null },
  ],
  statusField: "status",
  completion: { column: "read_at", field: "readAt", whenStatus: "read" },
});
