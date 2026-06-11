import type { MovieCard as MovieCardType } from "../../types/movie";
import type { MovieLibraryEntry } from "../../types/movieLibrary";
import { MovieCard } from "../MovieCard/MovieCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import styles from "./MovieGrid.module.css";

interface MovieGridProps {
  movies: MovieCardType[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onCardClick: (movie: MovieCardType) => void;
  onAddToLibrary: (movie: MovieCardType) => void;
  getLibraryEntry: (tmdbId: number) => MovieLibraryEntry | undefined;
  emptyMessage?: string;
  isLibraryView?: boolean;
  animationKey?: string;
}

export function MovieGrid({
  movies,
  loading,
  error,
  hasNextPage,
  onLoadMore,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  emptyMessage = "Nenhum filme encontrado.",
  isLibraryView,
  animationKey,
}: MovieGridProps) {
  if (loading && movies.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && movies.length === 0) {
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

  if (!loading && movies.length === 0) {
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
      {movies.map((movie, index) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          libraryEntry={getLibraryEntry(movie.id)}
          onClick={() => onCardClick(movie)}
          onAdd={() => onAddToLibrary(movie)}
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
