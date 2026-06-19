import { Fragment, useState } from "react";
import type { MovieCard as MovieCardType } from "../../types/movie";
import type { MovieLibraryEntry } from "../../types/movieLibrary";
import type { MovieGroup } from "../../utils/movieCollectionGroups";
import { movieLibraryEntryToCard } from "../../utils/movieLibraryEntryToCard";
import { MovieCard } from "../MovieCard/MovieCard";
import { MovieFranchiseCard } from "../MovieFranchiseCard/MovieFranchiseCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import gridStyles from "../MovieGrid/MovieGrid.module.css";
import styles from "../FranchiseGrid/FranchiseGrid.module.css";

interface MovieFranchiseGridProps {
  groups: MovieGroup[];
  loading: boolean;
  error: string | null;
  onCardClick: (movie: MovieCardType) => void;
  onAddToLibrary: (movie: MovieCardType) => void;
  getLibraryEntry: (tmdbId: number) => MovieLibraryEntry | undefined;
  emptyMessage?: string;
  animationKey?: string;
}

export function MovieFranchiseGrid({
  groups,
  loading,
  error,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  emptyMessage = "Nenhum filme encontrado.",
  animationKey,
}: MovieFranchiseGridProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading && groups.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && groups.length === 0) {
    return (
      <div className={gridStyles.grid}>
        <div className={gridStyles.errorState}>
          <div className={gridStyles.emptyIcon}>⚠️</div>
          <div className={gridStyles.emptyTitle}>Ops!</div>
          <div className={gridStyles.emptyText}>{error}</div>
        </div>
      </div>
    );
  }

  if (!loading && groups.length === 0) {
    return (
      <div className={gridStyles.grid}>
        <div className={gridStyles.emptyState}>
          <div className={gridStyles.emptyIcon}>📭</div>
          <div className={gridStyles.emptyTitle}>{emptyMessage}</div>
          <div className={gridStyles.emptyText}>Adicione filmes para começar!</div>
        </div>
      </div>
    );
  }

  return (
    <div className={gridStyles.grid} key={animationKey}>
      {groups.map((group, index) => {
        if (group.count === 1) {
          const card = movieLibraryEntryToCard(group.representative);
          return (
            <MovieCard
              key={group.key}
              movie={card}
              libraryEntry={getLibraryEntry(card.id)}
              onClick={() => onCardClick(card)}
              onAdd={() => onAddToLibrary(card)}
              isLibraryView
              index={index}
            />
          );
        }

        return (
          <Fragment key={group.key}>
            <MovieFranchiseCard
              group={group}
              expanded={expanded.has(group.key)}
              onToggle={() => toggle(group.key)}
              onCardClick={onCardClick}
              onAddToLibrary={onAddToLibrary}
              libraryEntry={getLibraryEntry(group.representative.tmdbId)}
              index={index}
            />
            {expanded.has(group.key) && (
              <div className={styles.expansion}>
                {group.members.map((member, memberIndex) => {
                  const card = movieLibraryEntryToCard(member);
                  return (
                    <MovieCard
                      key={member.tmdbId}
                      movie={card}
                      libraryEntry={getLibraryEntry(member.tmdbId)}
                      onClick={() => onCardClick(card)}
                      onAdd={() => onAddToLibrary(card)}
                      isLibraryView
                      index={memberIndex}
                    />
                  );
                })}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
