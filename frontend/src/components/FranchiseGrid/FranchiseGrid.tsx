import { useState } from "react";
import { useGridColumns } from "../../hooks/useGridColumns";
import { arrangeRowAwareCells, type RowAwareItem } from "../../utils/rowAwareCells";
import { MediaCard, type MediaCardConfig } from "../MediaCard/MediaCard";
import { FranchiseCard, type MediaGroup } from "../FranchiseCard/FranchiseCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import gridStyles from "../MediaGrid/MediaGrid.module.css";
import styles from "./FranchiseGrid.module.css";

interface FranchiseGridProps<
  E extends { status: string; score: number; title: string },
  T extends { id: number | string }
> {
  groups: MediaGroup<E>[];
  loading: boolean;
  error: string | null;
  cardConfig: MediaCardConfig<T>;
  entryToCard: (entry: E) => T;
  getExternalId: (entry: E) => T["id"];
  getLibraryEntry: (id: T["id"]) => E | undefined;
  onCardClick: (card: T) => void;
  onAddToLibrary: (card: T) => void;
  onDeleteGroup: (group: MediaGroup<E>) => void;
  emptyMessage?: string;
  emptyHint?: string;
  expandTitle: string;
  animationKey?: string;
}

export function FranchiseGrid<
  E extends { status: string; score: number; title: string },
  T extends { id: number | string }
>({
  groups,
  loading,
  error,
  cardConfig,
  entryToCard,
  getExternalId,
  getLibraryEntry,
  onCardClick,
  onAddToLibrary,
  onDeleteGroup,
  emptyMessage = "Nada encontrado.",
  emptyHint = "Adicione itens para começar!",
  expandTitle,
  animationKey,
}: FranchiseGridProps<E, T>) {
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
          <div className={gridStyles.emptyText}>{emptyHint}</div>
        </div>
      </div>
    );
  }

  const items: RowAwareItem[] = groups.map((group, index) => {
    if (group.count === 1) {
      const card = entryToCard(group.representative);
      return {
        card: (
          <MediaCard
            key={group.key}
            item={card}
            config={cardConfig}
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
          libraryEntry={getLibraryEntry(getExternalId(group.representative))}
          index={index}
          cardConfig={cardConfig}
          entryToCard={entryToCard}
          expandTitle={expandTitle}
        />
      ),
      expansion: isExpanded ? (
        <div className={styles.expansion} key={`exp-${group.key}`}>
          {group.members.map((member, memberIndex) => {
            const card = entryToCard(member);
            return (
              <MediaCard
                key={getExternalId(member)}
                item={card}
                config={cardConfig}
                libraryEntry={getLibraryEntry(getExternalId(member))}
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
