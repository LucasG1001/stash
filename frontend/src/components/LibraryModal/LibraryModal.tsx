import { useState, useEffect, useCallback } from "react";
import type { AnimeCard } from "../../types/anime";
import type { LibraryEntry, LibraryStatus } from "../../types/library";
import { LIBRARY_STATUS_LABELS } from "../../types/library";
import styles from "./LibraryModal.module.css";

interface LibraryModalProps {
  anime: AnimeCard;
  libraryEntry: LibraryEntry | undefined;
  onClose: () => void;
  onSave: (anime: AnimeCard, data: { status: LibraryStatus; score: number }) => void;
  onRemove: (id: string) => void;
}

export function LibraryModal({ anime, libraryEntry, onClose, onSave, onRemove }: LibraryModalProps) {
  const [status, setStatus] = useState<LibraryStatus>(libraryEntry?.status ?? "plan_to_watch");
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
    onSave(anime, { status, score });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        
        <div className={styles.header}>
          <img className={styles.coverImage} src={anime.coverImage} alt={anime.title} />
          <div className={styles.title}>{anime.title}</div>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Status</span>
            <select
              className={styles.controlSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as LibraryStatus)}
            >
              {Object.entries(LIBRARY_STATUS_LABELS).map(([key, label]) => (
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
