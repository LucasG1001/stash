import type { ReactNode, MouseEvent } from "react";
import styles from "./MediaCard.module.css";

export type StatusTone = "green" | "blue" | "orange";

export interface MediaCardConfig<T> {
  getTitle: (item: T) => string;
  getImage: (item: T) => string | null;
  placeholderEmoji?: string;
  coverAspect?: string;
  getStatusBadge?: (item: T) => { label: string; tone: StatusTone } | null;
  getScore?: (item: T) => number | null;
  formatScore?: (score: number) => string;
  scoreColor?: (score: number) => string;
  libraryStatusColor: (status: string | undefined) => string;
  renderMeta: (item: T) => ReactNode;
}

const TONE_CLASS: Record<StatusTone, string> = {
  green: styles.statusGreen,
  blue: styles.statusBlue,
  orange: styles.statusOrange,
};

interface MediaCardProps<T, E extends { status: string; score: number }> {
  item: T;
  config: MediaCardConfig<T>;
  libraryEntry?: E;
  onClick: () => void;
  onAdd: (e: MouseEvent) => void;
  isLibraryView?: boolean;
  index?: number;
}

export function MediaCard<T, E extends { status: string; score: number }>({
  item,
  config,
  libraryEntry,
  onClick,
  onAdd,
  isLibraryView,
  index = 0,
}: MediaCardProps<T, E>) {
  const title = config.getTitle(item);
  const image = config.getImage(item);
  const badge = config.getStatusBadge?.(item) ?? null;
  const score = config.getScore?.(item) ?? null;

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
      onClick={onClick}
      role="button"
      aria-label={title}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div
        className={styles.imageWrapper}
        style={config.coverAspect ? { aspectRatio: config.coverAspect } : undefined}
      >
        {image ? (
          <img className={styles.coverImage} src={image} alt={title} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.coverPlaceholder}>{config.placeholderEmoji ?? "🎬"}</div>
        )}

        <div className={styles.overlay}>
          <div className={styles.title}>{title}</div>
          {config.renderMeta(item)}
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
              <span
                className={styles.statusDot}
                style={{ backgroundColor: config.libraryStatusColor(libraryEntry.status) }}
              />
            ) : (
              "+"
            )}
          </button>
          {badge && (
            <span className={`${styles.statusBadge} ${TONE_CLASS[badge.tone]}`}>{badge.label}</span>
          )}
        </div>

        {isLibraryView
          ? libraryEntry && libraryEntry.score > 0 && (
              <span className={`${styles.scoreBadge} ${styles.libraryScoreBadge}`}>
                ⭐ {libraryEntry.score.toFixed(1)}
              </span>
            )
          : score != null && score > 0 && config.formatScore && config.scoreColor && (
              <span className={styles.scoreBadge} style={{ color: config.scoreColor(score) }}>
                ★ {config.formatScore(score)}
              </span>
            )}
      </div>
    </div>
  );
}
