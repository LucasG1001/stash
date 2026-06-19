import { Fragment, useState } from "react";
import type { AnimeCard as AnimeCardType } from "../../types/anime";
import type { LibraryEntry } from "../../types/library";
import type { FranchiseGroup } from "../../utils/franchiseGroups";
import { libraryEntryToCard } from "../../utils/libraryEntryToCard";
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
  emptyMessage = "Nenhum anime encontrado.",
  animationKey,
}: FranchiseGridProps) {
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
          <div className={gridStyles.emptyText}>Adicione animes para começar!</div>
        </div>
      </div>
    );
  }

  return (
    <div className={gridStyles.grid} key={animationKey}>
      {groups.map((group, index) => {
        if (group.count === 1) {
          const card = libraryEntryToCard(group.representative);
          return (
            <AnimeCard
              key={group.key}
              anime={card}
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
            <FranchiseCard
              group={group}
              expanded={expanded.has(group.key)}
              onToggle={() => toggle(group.key)}
              onCardClick={onCardClick}
              onAddToLibrary={onAddToLibrary}
              libraryEntry={getLibraryEntry(group.representative.anilistId)}
              index={index}
            />
            {expanded.has(group.key) && (
              <div className={styles.expansion}>
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
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
