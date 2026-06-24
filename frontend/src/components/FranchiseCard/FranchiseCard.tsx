import { MediaCard, type MediaCardConfig } from "../MediaCard/MediaCard";
import styles from "./FranchiseCard.module.css";

export interface MediaGroup<E> {
  key: string;
  representative: E;
  members: E[];
  count: number;
  completedCount: number;
}

interface FranchiseCardProps<
  E extends { status: string; score: number; title: string },
  T extends { id: number | string }
> {
  group: MediaGroup<E>;
  expanded: boolean;
  onToggle: () => void;
  onCardClick: (card: T) => void;
  onAddToLibrary: (card: T) => void;
  onDelete: () => void;
  libraryEntry?: E;
  index: number;
  cardConfig: MediaCardConfig<T>;
  entryToCard: (entry: E) => T;
  expandTitle: string;
}

export function FranchiseCard<
  E extends { status: string; score: number; title: string },
  T extends { id: number | string }
>({
  group,
  expanded,
  onToggle,
  onCardClick,
  onAddToLibrary,
  onDelete,
  libraryEntry,
  index,
  cardConfig,
  entryToCard,
  expandTitle,
}: FranchiseCardProps<E, T>) {
  const card = entryToCard(group.representative);

  return (
    <div className={styles.wrapper}>
      <MediaCard
        item={card}
        config={cardConfig}
        libraryEntry={libraryEntry}
        onClick={() => onCardClick(card)}
        onAdd={() => onAddToLibrary(card)}
        isLibraryView
        index={index}
      />
      <button
        className={styles.deleteButton}
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Remover toda a coleção "${group.representative.title}" (${group.count} itens) da biblioteca?`)) onDelete();
        }}
        title="Remover coleção da biblioteca"
        aria-label="Remover coleção da biblioteca"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
      <button
        className={`${styles.franchiseBadge} ${expanded ? styles.expanded : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title={expanded ? "Recolher coleção" : expandTitle}
      >
        <span className={styles.count}>📚 {group.completedCount}/{group.count}</span>
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
