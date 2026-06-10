import type { AnimeCard as AnimeCardType } from "../../types/anime";
import type { LibraryEntry } from "../../types/library";
import styles from "./AnimeCard.module.css";

interface AnimeCardProps {
  anime: AnimeCardType;
  libraryEntry?: LibraryEntry;
  onClick: () => void;
  onAdd: (e: React.MouseEvent) => void;
  isLibraryView?: boolean;
}

function getStatusStyle(status: string): string {
  switch (status) {
    case "RELEASING": return styles.statusAiring;
    case "FINISHED": return styles.statusFinished;
    case "NOT_YET_RELEASED": return styles.statusUpcoming;
    default: return styles.statusFinished;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "RELEASING": return "Em exibição";
    case "FINISHED": return "Finalizado";
    case "NOT_YET_RELEASED": return "Em breve";
    default: return status;
  }
}

function getScoreColor(score: number): string {
  if (score >= 75) return "var(--color-score-high)";
  if (score >= 50) return "var(--color-score-mid)";
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

export function AnimeCard({ anime, libraryEntry, onClick, onAdd, isLibraryView }: AnimeCardProps) {
  let episodeText = "";
  if (anime.nextAiringEpisode) {
    episodeText = `${anime.nextAiringEpisode.episode - 1}/${anime.episodes ?? "?"}`;
  } else {
    episodeText = `${anime.episodes ?? "?"}`;
  }

  return (
    <div className={styles.card} onClick={onClick} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className={styles.imageWrapper}>
        <img className={styles.coverImage} src={anime.coverImage} alt={anime.title} loading="lazy" />

        <div className={styles.overlay}>
          <div className={styles.title}>{anime.title}</div>
          {!isLibraryView && (
            <div className={styles.meta}>
              <span className={styles.episodes}>📺 {episodeText} ep</span>
              {anime.streamingLinks.length > 0 && (
                <div className={styles.streamingIcons}>
                  {anime.streamingLinks.slice(0, 3).map((link) =>
                    link.icon ? (
                      <img
                        key={link.site}
                        className={styles.streamingIcon}
                        src={link.icon}
                        alt={link.site}
                        title={link.site}
                      />
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.topBadges}>
          <button
            className={`${styles.addButton} ${libraryEntry ? styles.inLibrary : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(e);
            }}
            title={libraryEntry ? "Na biblioteca" : "Adicionar à biblioteca"}
          >
            {libraryEntry ? (
              <span className={styles.statusDot} style={{ backgroundColor: getLibraryStatusColor(libraryEntry.status) }} />
            ) : (
              "+"
            )}
          </button>
          {!isLibraryView && (
            <span className={`${styles.statusBadge} ${getStatusStyle(anime.status)}`}>
              {getStatusLabel(anime.status)}
            </span>
          )}
          {isLibraryView && libraryEntry && (
            <>
              {libraryEntry.status === "watched" && libraryEntry.updatedAt && (
                <span className={`${styles.statusBadge} ${styles.libraryDateBadge}`}>
                  {new Date(libraryEntry.updatedAt).toLocaleDateString("pt-BR")}
                </span>
              )}
              {libraryEntry.score > 0 && (
                <span className={`${styles.statusBadge} ${styles.libraryScoreBadge}`}>
                  ⭐ {libraryEntry.score}
                </span>
              )}
            </>
          )}
        </div>

        {!isLibraryView && anime.averageScore && (
          <span className={styles.scoreBadge} style={{ color: getScoreColor(anime.averageScore) }}>
            ★ {(anime.averageScore / 10).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
