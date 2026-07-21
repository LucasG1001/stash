import { useCallback } from "react";
import { useMediaList } from "./useMediaList";
import type { MovieCard } from "../types/movie";
import { fetchPopular, fetchNowPlaying, searchMovies } from "../services/movieService";

export function useMovies() {
  const { items, loading, error, hasNextPage, load, loadMore, reset } = useMediaList<MovieCard>(
    "Erro ao carregar filmes. Tente novamente."
  );

  const loadPopular = useCallback((year: number, month: number) =>
    load(`popular:${year}:${month}`, (p, signal) =>
      fetchPopular(year, month || undefined, p, signal).then((r) => ({ items: r.movies, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const loadNowPlaying = useCallback(() =>
    load("now_playing", (p, signal) =>
      fetchNowPlaying(p, signal).then((r) => ({ items: r.movies, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const search = useCallback((query: string) =>
    load(`search:${query}`, (p, signal) =>
      searchMovies(query, p, signal).then((r) => ({ items: r.movies, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  return { movies: items, loading, error, hasNextPage, loadPopular, loadNowPlaying, search, loadMore, reset };
}
