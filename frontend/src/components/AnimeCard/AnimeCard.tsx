import type { AnimeCard as AnimeCardType } from "../../types/anime";
import styles from "./AnimeCard.module.css";

interface AnimeCardProps {
  anime: AnimeCardType;
  inLibrary: boolean;
  onClick: () => void;
  onAdd: (e: React.MouseEvent) => void;
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

export function AnimeCard({ anime, inLibrary, onClick, onAdd }: AnimeCardProps) {
  const episodeText = anime.nextAiringEpisode
    ? `${anime.nextAiringEpisode.episode - 1}/${anime.episodes ?? "?"}`
    : `${anime.episodes ?? "?"}`;

  return (
    <div className={styles.card} onClick={onClick} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className={styles.imageWrapper}>
        <img className={styles.coverImage} src={anime.coverImage} alt={anime.title} loading="lazy" />

        <div className={styles.overlay}>
          <div className={styles.title}>{anime.title}</div>
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
        </div>

        <span className={`${styles.statusBadge} ${getStatusStyle(anime.status)}`}>
          {getStatusLabel(anime.status)}
        </span>

        {anime.averageScore && (
          <span className={styles.scoreBadge} style={{ color: getScoreColor(anime.averageScore) }}>
            ★ {(anime.averageScore / 10).toFixed(1)}
          </span>
        )}
      </div>

      <button
        className={`${styles.addButton} ${inLibrary ? styles.inLibrary : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onAdd(e);
        }}
        title={inLibrary ? "Na biblioteca" : "Adicionar à biblioteca"}
      >
        {inLibrary ? "✓" : "+"}
      </button>
    </div>
  );
}
