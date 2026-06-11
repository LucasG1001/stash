import type { SeriesCard as SeriesCardType } from "../../types/series";
import type { SeriesLibraryEntry } from "../../types/seriesLibrary";
import { SeriesCard } from "../SeriesCard/SeriesCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import styles from "./SeriesGrid.module.css";

interface SeriesGridProps {
  series: SeriesCardType[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onCardClick: (series: SeriesCardType) => void;
  onAddToLibrary: (series: SeriesCardType) => void;
  getLibraryEntry: (tmdbId: number) => SeriesLibraryEntry | undefined;
  emptyMessage?: string;
  isLibraryView?: boolean;
  animationKey?: string;
}

export function SeriesGrid({
  series,
  loading,
  error,
  hasNextPage,
  onLoadMore,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  emptyMessage = "Nenhuma série encontrada.",
  isLibraryView,
  animationKey,
}: SeriesGridProps) {
  if (loading && series.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && series.length === 0) {
    return (
      <div className={styles.grid}>
        <div className={styles.errorState}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyTitle}>Ops!</div>
          <div className={styles.emptyText}>{error}</div>
        </div>
      </div>
    );
  }

  if (!loading && series.length === 0) {
    return (
      <div className={styles.grid}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>{emptyMessage}</div>
          <div className={styles.emptyText}>Tente uma busca diferente.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.grid} key={animationKey}>
      {series.map((item, index) => (
        <SeriesCard
          key={item.id}
          series={item}
          libraryEntry={getLibraryEntry(item.id)}
          onClick={() => onCardClick(item)}
          onAdd={() => onAddToLibrary(item)}
          isLibraryView={isLibraryView}
          index={index}
        />
      ))}

      {hasNextPage && (
        <div className={styles.loadMoreWrapper}>
          <button className={styles.loadMoreButton} onClick={onLoadMore} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}
