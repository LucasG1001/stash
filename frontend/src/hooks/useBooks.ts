import { useCallback } from "react";
import { useMediaList } from "./useMediaList";
import type { BookCard } from "../types/book";
import { fetchByGenre, searchBooks } from "../services/bookService";

export function useBooks() {
  const { items, loading, error, hasNextPage, load, loadMore } = useMediaList<BookCard>(
    "Erro ao carregar livros. Tente novamente."
  );

  const loadByGenre = useCallback((genre: string) =>
    load(`genre:${genre}`, (p) =>
      fetchByGenre(genre, p).then((r) => ({ items: r.books, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const search = useCallback((query: string) =>
    load(`search:${query}`, (p) =>
      searchBooks(query, p).then((r) => ({ items: r.books, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  return { books: items, loading, error, hasNextPage, loadByGenre, search, loadMore };
}
