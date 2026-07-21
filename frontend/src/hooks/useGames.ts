import { useCallback } from "react";
import { useMediaList } from "./useMediaList";
import type { GameCard } from "../types/game";
import { fetchPopular, fetchUpcoming, searchGames } from "../services/gameService";

export function useGames() {
  const { items, loading, error, hasNextPage, load, loadMore, reset } = useMediaList<GameCard>(
    "Erro ao carregar jogos. Tente novamente."
  );

  const loadPopular = useCallback((year: number, month: number) =>
    load(`popular:${year}:${month}`, (p, signal) =>
      fetchPopular(year, month || undefined, p, signal).then((r) => ({ items: r.games, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const loadUpcoming = useCallback(() =>
    load("upcoming", (p, signal) =>
      fetchUpcoming(p, signal).then((r) => ({ items: r.games, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const search = useCallback((query: string) =>
    load(`search:${query}`, (p, signal) =>
      searchGames(query, p, signal).then((r) => ({ items: r.games, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  return { games: items, loading, error, hasNextPage, loadPopular, loadUpcoming, search, loadMore, reset };
}
