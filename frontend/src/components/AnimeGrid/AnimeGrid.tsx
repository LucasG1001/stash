import type { AnimeCard as AnimeCardType } from "../../types/anime";
import type { LibraryEntry } from "../../types/library";
import { AnimeCard } from "../AnimeCard/AnimeCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import styles from "./AnimeGrid.module.css";

interface AnimeGridProps {
  animes: AnimeCardType[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onCardClick: (anime: AnimeCardType) => void;
  onAddToLibrary: (anime: AnimeCardType) => void;
  getLibraryEntry: (anilistId: number) => LibraryEntry | undefined;
  emptyMessage?: string;
  isLibraryView?: boolean;
  animationKey?: string;
}

export function AnimeGrid({
  animes,
  loading,
  error,
  hasNextPage,
  onLoadMore,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  emptyMessage = "Nenhum anime encontrado.",
  isLibraryView,
  animationKey,
}: AnimeGridProps) {
  if (loading && animes.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && animes.length === 0) {
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

  if (!loading && animes.length === 0) {
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
      {animes.map((anime, index) => (
        <AnimeCard
          key={anime.id}
          anime={anime}
          libraryEntry={getLibraryEntry(anime.id)}
          onClick={() => onCardClick(anime)}
          onAdd={() => onAddToLibrary(anime)}
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
