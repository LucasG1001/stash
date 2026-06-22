import type { SeriesCard as SeriesCardType } from "../../types/series";
import type { SeriesLibraryEntry } from "../../types/seriesLibrary";
import styles from "./SeriesCard.module.css";

interface SeriesCardProps {
  series: SeriesCardType;
  libraryEntry?: SeriesLibraryEntry;
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
    case "RELEASED": return "No ar";
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
    case "plan_to_watch": return "var(--color-text-secondary)";
    case "watching": return "var(--color-info)";
    case "watched": return "var(--color-success)";
    case "dropped": return "var(--color-error)";
    default: return "var(--color-text-secondary)";
  }
}

export function SeriesCard({ series, libraryEntry, onClick, onAdd, isLibraryView, index = 0 }: SeriesCardProps) {
  const year = series.firstAirDate ? series.firstAirDate.slice(0, 4) : "—";

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
      onClick={onClick}
      role="button"
      aria-label={series.title}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className={styles.imageWrapper}>
        {series.posterImage ? (
          <img className={styles.coverImage} src={series.posterImage} alt={series.title} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.coverPlaceholder}>📺</div>
        )}

        <div className={styles.overlay}>
          <div className={styles.title}>{series.title}</div>
          <div className={styles.meta}>
            <span className={styles.year}>📅 {year}</span>
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
          <span className={`${styles.statusBadge} ${getStatusStyle(series.seriesStatus)}`}>
            {getStatusLabel(series.seriesStatus)}
          </span>
        </div>

        {isLibraryView
          ? libraryEntry && libraryEntry.score > 0 && (
              <span className={`${styles.scoreBadge} ${styles.libraryScoreBadge}`}>
                ⭐ {libraryEntry.score.toFixed(1)}
              </span>
            )
          : series.voteAverage != null && series.voteAverage > 0 && (
              <span className={styles.scoreBadge} style={{ color: getScoreColor(series.voteAverage) }}>
                ★ {series.voteAverage.toFixed(1)}
              </span>
            )}
      </div>
    </div>
  );
}
