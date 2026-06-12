import { useCallback } from "react";
import { useMediaList } from "./useMediaList";
import type { SeriesCard } from "../types/series";
import { fetchPopular, searchSeries } from "../services/seriesService";

export function useSeries() {
  const { items, loading, error, hasNextPage, load, loadMore } = useMediaList<SeriesCard>(
    "Erro ao carregar séries. Tente novamente."
  );

  const loadPopular = useCallback((year: number, month: number) =>
    load(`popular:${year}:${month}`, (p) =>
      fetchPopular(year, month || undefined, p).then((r) => ({ items: r.series, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  const search = useCallback((query: string) =>
    load(`search:${query}`, (p) =>
      searchSeries(query, p).then((r) => ({ items: r.series, hasNextPage: r.pageInfo.hasNextPage }))
    ), [load]);

  return { series: items, loading, error, hasNextPage, loadPopular, search, loadMore };
}
