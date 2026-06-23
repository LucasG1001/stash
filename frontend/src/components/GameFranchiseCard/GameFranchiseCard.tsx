import type { GameCard as GameCardType } from "../../types/game";
import type { GameLibraryEntry } from "../../types/gameLibrary";
import type { GameGroup } from "../../utils/gameCollectionGroups";
import { gameLibraryEntryToCard } from "../../utils/gameLibraryEntryToCard";
import { GameCard } from "../GameCard/GameCard";
import styles from "../FranchiseCard/FranchiseCard.module.css";

interface GameFranchiseCardProps {
  group: GameGroup;
  expanded: boolean;
  onToggle: () => void;
  onCardClick: (game: GameCardType) => void;
  onAddToLibrary: (game: GameCardType) => void;
  onDelete: () => void;
  libraryEntry?: GameLibraryEntry;
  index: number;
}

export function GameFranchiseCard({ group, expanded, onToggle, onCardClick, onAddToLibrary, onDelete, libraryEntry, index }: GameFranchiseCardProps) {
  const card = gameLibraryEntryToCard(group.representative);

  return (
    <div className={styles.wrapper}>
      <GameCard
        game={card}
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
        title={expanded ? "Recolher coleção" : "Ver jogos da coleção"}
      >
        <span className={styles.count}>📚 {group.completedCount}/{group.count}</span>
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
