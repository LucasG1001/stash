import type { GameCard as GameCardType } from "../../types/game";
import type { GameLibraryEntry } from "../../types/gameLibrary";
import { GameCard } from "../GameCard/GameCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import styles from "./GameGrid.module.css";

interface GameGridProps {
  games: GameCardType[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onCardClick: (game: GameCardType) => void;
  onAddToLibrary: (game: GameCardType) => void;
  getLibraryEntry: (rawgId: number) => GameLibraryEntry | undefined;
  emptyMessage?: string;
  isLibraryView?: boolean;
  animationKey?: string;
}

export function GameGrid({
  games,
  loading,
  error,
  hasNextPage,
  onLoadMore,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  emptyMessage = "Nenhum jogo encontrado.",
  isLibraryView,
  animationKey,
}: GameGridProps) {
  if (loading && games.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && games.length === 0) {
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

  if (!loading && games.length === 0) {
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
      {games.map((game, index) => (
        <GameCard
          key={game.id}
          game={game}
          libraryEntry={getLibraryEntry(game.id)}
          onClick={() => onCardClick(game)}
          onAdd={() => onAddToLibrary(game)}
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
