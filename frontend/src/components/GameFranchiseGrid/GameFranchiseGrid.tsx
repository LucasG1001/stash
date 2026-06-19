import { useState } from "react";
import type { GameCard as GameCardType } from "../../types/game";
import type { GameLibraryEntry } from "../../types/gameLibrary";
import type { GameGroup } from "../../utils/gameCollectionGroups";
import { gameLibraryEntryToCard } from "../../utils/gameLibraryEntryToCard";
import { useGridColumns } from "../../hooks/useGridColumns";
import { arrangeRowAwareCells, type RowAwareItem } from "../../utils/rowAwareCells";
import { GameCard } from "../GameCard/GameCard";
import { GameFranchiseCard } from "../GameFranchiseCard/GameFranchiseCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import gridStyles from "../GameGrid/GameGrid.module.css";
import styles from "../FranchiseGrid/FranchiseGrid.module.css";

interface GameFranchiseGridProps {
  groups: GameGroup[];
  loading: boolean;
  error: string | null;
  onCardClick: (game: GameCardType) => void;
  onAddToLibrary: (game: GameCardType) => void;
  getLibraryEntry: (igdbId: number) => GameLibraryEntry | undefined;
  emptyMessage?: string;
  animationKey?: string;
}

export function GameFranchiseGrid({
  groups,
  loading,
  error,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  emptyMessage = "Nenhum jogo encontrado.",
  animationKey,
}: GameFranchiseGridProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [cols, setGridRef] = useGridColumns();

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
          <div className={gridStyles.emptyText}>Adicione jogos para começar!</div>
        </div>
      </div>
    );
  }

  const items: RowAwareItem[] = groups.map((group, index) => {
    if (group.count === 1) {
      const card = gameLibraryEntryToCard(group.representative);
      return {
        card: (
          <GameCard
            key={group.key}
            game={card}
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

    const isExpanded = expanded.has(group.key);
    return {
      card: (
        <GameFranchiseCard
          key={group.key}
          group={group}
          expanded={isExpanded}
          onToggle={() => toggle(group.key)}
          onCardClick={onCardClick}
          onAddToLibrary={onAddToLibrary}
          libraryEntry={getLibraryEntry(group.representative.igdbId)}
          index={index}
        />
      ),
      expansion: isExpanded ? (
        <div className={styles.expansion} key={`exp-${group.key}`}>
          {group.members.map((member, memberIndex) => {
            const card = gameLibraryEntryToCard(member);
            return (
              <GameCard
                key={member.igdbId}
                game={card}
                libraryEntry={getLibraryEntry(member.igdbId)}
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
