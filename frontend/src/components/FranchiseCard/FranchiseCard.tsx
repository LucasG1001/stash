import type { AnimeCard as AnimeCardType } from "../../types/anime";
import type { LibraryEntry } from "../../types/library";
import type { FranchiseGroup } from "../../utils/franchiseGroups";
import { libraryEntryToCard } from "../../utils/libraryEntryToCard";
import { AnimeCard } from "../AnimeCard/AnimeCard";
import styles from "./FranchiseCard.module.css";

interface FranchiseCardProps {
  group: FranchiseGroup;
  expanded: boolean;
  onToggle: () => void;
  onCardClick: (anime: AnimeCardType) => void;
  onAddToLibrary: (anime: AnimeCardType) => void;
  libraryEntry?: LibraryEntry;
  index: number;
}

export function FranchiseCard({ group, expanded, onToggle, onCardClick, onAddToLibrary, libraryEntry, index }: FranchiseCardProps) {
  const card = libraryEntryToCard(group.representative);

  return (
    <div className={styles.wrapper}>
      <AnimeCard
        anime={card}
        libraryEntry={libraryEntry}
        onClick={() => onCardClick(card)}
        onAdd={() => onAddToLibrary(card)}
        isLibraryView
        index={index}
      />
      <button
        className={`${styles.franchiseBadge} ${expanded ? styles.expanded : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title={expanded ? "Recolher franquia" : "Ver temporadas, OVAs e filmes"}
      >
        <span className={styles.count}>📚 {group.completedCount}/{group.count}</span>
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
