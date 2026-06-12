import { useCallback } from "react";
import { useMediaList } from "./useMediaList";
import type { MovieCard } from "../types/movie";
import { fetchPopular, fetchNowPlaying, searchMovies } from "../services/movieService";

export function useMovies() {
  const { items, loading, error, hasNextPage, load, loadMore } = useMediaList<MovieCard>(
    "Erro ao carregar filmes. Tente novamente."
  );

  const loadPopular = useCallback((year: number, month: number) =>
    load(`popular:${year}:${month}`, (p) =>
      fetchPopular(year, month || undefined, p).then((r) => ({ items: r.movies, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const loadNowPlaying = useCallback(() =>
    load("now_playing", (p) =>
      fetchNowPlaying(p).then((r) => ({ items: r.movies, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const search = useCallback((query: string) =>
    load(`search:${query}`, (p) =>
      searchMovies(query, p).then((r) => ({ items: r.movies, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  return { movies: items, loading, error, hasNextPage, loadPopular, loadNowPlaying, search, loadMore };
}
