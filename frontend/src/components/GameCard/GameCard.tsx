import type { GameCard as GameCardType } from "../../types/game";
import type { GameLibraryEntry } from "../../types/gameLibrary";
import { StoreGlyph } from "./StoreIcons";
import styles from "./GameCard.module.css";

interface GameCardProps {
  game: GameCardType;
  libraryEntry?: GameLibraryEntry;
  onClick: () => void;
  onAdd: (e: React.MouseEvent) => void;
  isLibraryView?: boolean;
  index?: number;
}

function getStatusStyle(status: string): string {
  switch (status) {
    case "RELEASED": return styles.statusReleased;
    case "UPCOMING": return styles.statusUpcoming;
    default: return styles.statusReleased;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "RELEASED": return "Lançado";
    case "UPCOMING": return "Em breve";
    default: return status;
  }
}

function getScoreColor(score: number): string {
  if (score >= 7.5) return "var(--color-score-high)";
  if (score >= 5) return "var(--color-score-mid)";
  return "var(--color-score-low)";
}

function getLibraryStatusColor(status?: string): string {
  switch (status) {
    case "plan_to_play": return "var(--color-text-secondary)";
    case "playing": return "var(--color-info)";
    case "beaten": return "var(--color-success)";
    case "dropped": return "var(--color-error)";
    default: return "var(--color-text-secondary)";
  }
}

export function GameCard({ game, libraryEntry, onClick, onAdd, isLibraryView, index = 0 }: GameCardProps) {
  const year = game.released ? game.released.slice(0, 4) : "—";

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
      onClick={onClick}
      role="button"
      aria-label={game.title}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className={styles.imageWrapper}>
        {game.backgroundImage ? (
          <img className={styles.coverImage} src={game.backgroundImage} alt={game.title} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.coverPlaceholder}>🎮</div>
        )}

        <div className={styles.overlay}>
          <div className={styles.title}>{game.title}</div>
          <div className={styles.meta}>
            <span className={styles.year}>📅 {year}</span>
            {game.storeSlugs.length > 0 && (
              <div className={styles.storeIcons}>
                {game.storeSlugs.slice(0, 3).map((slug) => (
                  <StoreGlyph key={slug} slug={slug} className={styles.storeIcon} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.topBadges}>
          <button
            type="button"
            className={`${styles.addButton} ${libraryEntry ? styles.inLibrary : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(e);
            }}
            title={libraryEntry ? "Na biblioteca" : "Adicionar à biblioteca"}
            aria-label={libraryEntry ? "Na biblioteca" : "Adicionar à biblioteca"}
          >
            {libraryEntry ? (
              <span className={styles.statusDot} style={{ backgroundColor: getLibraryStatusColor(libraryEntry.status) }} />
            ) : (
              "+"
            )}
          </button>
          <span className={`${styles.statusBadge} ${getStatusStyle(game.gameStatus)}`}>
            {getStatusLabel(game.gameStatus)}
          </span>
        </div>

        {isLibraryView
          ? libraryEntry && libraryEntry.score > 0 && (
              <span className={`${styles.scoreBadge} ${styles.libraryScoreBadge}`}>
                ⭐ {libraryEntry.score.toFixed(1)}
              </span>
            )
          : game.rating != null && game.rating > 0 && (
              <span className={styles.scoreBadge} style={{ color: getScoreColor(game.rating) }}>
                ★ {game.rating.toFixed(1)}
              </span>
            )}
      </div>
    </div>
  );
}
