import { useState } from "react";
import type { AnimeCard as AnimeCardType } from "../../types/anime";
import type { LibraryEntry } from "../../types/library";
import type { FranchiseGroup } from "../../utils/franchiseGroups";
import { libraryEntryToCard } from "../../utils/libraryEntryToCard";
import { useGridColumns } from "../../hooks/useGridColumns";
import { arrangeRowAwareCells, type RowAwareItem } from "../../utils/rowAwareCells";
import { AnimeCard } from "../AnimeCard/AnimeCard";
import { FranchiseCard } from "../FranchiseCard/FranchiseCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import gridStyles from "../AnimeGrid/AnimeGrid.module.css";
import styles from "./FranchiseGrid.module.css";

interface FranchiseGridProps {
  groups: FranchiseGroup[];
  loading: boolean;
  error: string | null;
  onCardClick: (anime: AnimeCardType) => void;
  onAddToLibrary: (anime: AnimeCardType) => void;
  getLibraryEntry: (anilistId: number) => LibraryEntry | undefined;
  onDeleteGroup: (group: FranchiseGroup) => void;
  emptyMessage?: string;
  animationKey?: string;
}

export function FranchiseGrid({
  groups,
  loading,
  error,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  onDeleteGroup,
  emptyMessage = "Nenhum anime encontrado.",
  animationKey,
}: FranchiseGridProps) {
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
          <div className={gridStyles.emptyText}>Adicione animes para começar!</div>
        </div>
      </div>
    );
  }

  const items: RowAwareItem[] = groups.map((group, index) => {
    if (group.count === 1) {
      const card = libraryEntryToCard(group.representative);
      return {
        card: (
          <AnimeCard
            key={group.key}
            anime={card}
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
        <FranchiseCard
          key={group.key}
          group={group}
          expanded={isExpanded}
          onToggle={() => toggle(group.key)}
          onCardClick={onCardClick}
          onAddToLibrary={onAddToLibrary}
          onDelete={() => onDeleteGroup(group)}
          libraryEntry={getLibraryEntry(group.representative.anilistId)}
          index={index}
        />
      ),
      expansion: isExpanded ? (
        <div className={styles.expansion} key={`exp-${group.key}`}>
          {group.members.map((member, memberIndex) => {
            const card = libraryEntryToCard(member);
            return (
              <AnimeCard
                key={member.anilistId}
                anime={card}
                libraryEntry={getLibraryEntry(member.anilistId)}
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
