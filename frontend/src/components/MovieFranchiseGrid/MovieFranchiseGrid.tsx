import { useState } from "react";
import type { MovieCard as MovieCardType } from "../../types/movie";
import type { MovieLibraryEntry } from "../../types/movieLibrary";
import type { MovieGroup } from "../../utils/movieCollectionGroups";
import { movieLibraryEntryToCard } from "../../utils/movieLibraryEntryToCard";
import { useGridColumns } from "../../hooks/useGridColumns";
import { arrangeRowAwareCells, type RowAwareItem } from "../../utils/rowAwareCells";
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
  onDeleteGroup: (group: MovieGroup) => void;
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
  onDeleteGroup,
  emptyMessage = "Nenhum filme encontrado.",
  animationKey,
}: MovieFranchiseGridProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [cols, setGridRef] = useGridColumns();

  const toggle = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
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

  const items: RowAwareItem[] = groups.map((group, index) => {
    if (group.count === 1) {
      const card = movieLibraryEntryToCard(group.representative);
      return {
        card: (
          <MovieCard
            key={group.key}
            movie={card}
            libraryEntry={getLibraryEntry(card.id)}
            onClick={() => onCardClick(card)}
            onAdd={() => onAddToLibrary(card)}
            isLibraryView
            index={index}
          />
        ),
        expansion: null,
      };
    }

    const isExpanded = expandedKey === group.key;
    return {
      card: (
        <MovieFranchiseCard
          key={group.key}
          group={group}
          expanded={isExpanded}
          onToggle={() => toggle(group.key)}
          onCardClick={onCardClick}
          onAddToLibrary={onAddToLibrary}
          onDelete={() => onDeleteGroup(group)}
          libraryEntry={getLibraryEntry(group.representative.tmdbId)}
          index={index}
        />
      ),
      expansion: isExpanded ? (
        <div className={styles.expansion} key={`exp-${group.key}`}>
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
      ) : null,
    };
  });

  return (
    <div className={gridStyles.grid} key={animationKey} ref={setGridRef}>
      {arrangeRowAwareCells(items, cols)}
    </div>
  );
}
