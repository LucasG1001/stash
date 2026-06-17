import type { BookCard as BookCardType } from "../../types/book";
import type { BookLibraryEntry } from "../../types/bookLibrary";
import styles from "./BookCard.module.css";

interface BookCardProps {
  book: BookCardType;
  libraryEntry?: BookLibraryEntry;
  onClick: () => void;
  onAdd: (e: React.MouseEvent) => void;
  isLibraryView?: boolean;
  index?: number;
}

function getScoreColor(score: number): string {
  if (score >= 4) return "var(--color-score-high)";
  if (score >= 2.5) return "var(--color-score-mid)";
  return "var(--color-score-low)";
}

function getLibraryStatusColor(status?: string): string {
  switch (status) {
    case "plan_to_read": return "var(--color-text-secondary)";
    case "reading": return "var(--color-info)";
    case "read": return "var(--color-success)";
    case "dropped": return "var(--color-error)";
    default: return "var(--color-text-secondary)";
  }
}

export function BookCard({ book, libraryEntry, onClick, onAdd, isLibraryView, index = 0 }: BookCardProps) {
  const authorLine = book.authors.length > 0
    ? book.authors.join(", ")
    : book.publishedDate
    ? book.publishedDate.slice(0, 4)
    : "—";

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className={styles.imageWrapper}>
        {book.coverImage ? (
          <img className={styles.coverImage} src={book.coverImage} alt={book.title} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.coverPlaceholder}>📚</div>
        )}

        <div className={styles.overlay}>
          <div className={styles.title}>{book.title}</div>
          <div className={styles.meta}>
            <span className={styles.author}>{authorLine}</span>
          </div>
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
        </div>

        {isLibraryView
          ? libraryEntry && libraryEntry.score > 0 && (
              <span className={`${styles.scoreBadge} ${styles.libraryScoreBadge}`}>
                ⭐ {libraryEntry.score.toFixed(1)}
              </span>
            )
          : book.averageRating != null && book.averageRating > 0 && (
              <span className={styles.scoreBadge} style={{ color: getScoreColor(book.averageRating) }}>
                ★ {book.averageRating.toFixed(1)}
              </span>
            )}
      </div>
    </div>
  );
}
