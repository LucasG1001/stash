import { useState, useEffect, useCallback } from "react";
import type { BookCard } from "../../types/book";
import type { BookLibraryEntry, BookLibraryStatus } from "../../types/bookLibrary";
import { BOOK_LIBRARY_STATUS_LABELS } from "../../types/bookLibrary";
import styles from "./BookLibraryModal.module.css";

interface BookLibraryModalProps {
  book: BookCard;
  libraryEntry: BookLibraryEntry | undefined;
  onClose: () => void;
  onSave: (book: BookCard, data: { status: BookLibraryStatus; score: number }) => void;
  onRemove: (id: string) => void;
}

export function BookLibraryModal({ book, libraryEntry, onClose, onSave, onRemove }: BookLibraryModalProps) {
  const [status, setStatus] = useState<BookLibraryStatus>(libraryEntry?.status ?? "plan_to_read");
  const [score, setScore] = useState<number>(libraryEntry?.score ?? 0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleSave = () => {
    onSave(book, { status, score });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>

        <div className={styles.header}>
          {book.coverImage ? (
            <img className={styles.coverImage} src={book.coverImage} alt={book.title} />
          ) : (
            <div className={styles.coverPlaceholder}>📚</div>
          )}
          <div className={styles.title}>{book.title}</div>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Status</span>
            <select
              className={styles.controlSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as BookLibraryStatus)}
            >
              {Object.entries(BOOK_LIBRARY_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Nota</span>
            <input
              className={styles.controlInput}
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={score}
              onChange={(e) => setScore(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
            />
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.saveButton} onClick={handleSave}>
              Salvar
            </button>
            {libraryEntry && (
              <button className={styles.removeButton} onClick={() => onRemove(libraryEntry.id)}>
                Remover
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
