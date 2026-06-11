import { useState, useEffect, useCallback } from "react";
import type { GameCard } from "../../types/game";
import type { GameLibraryEntry, GameLibraryStatus } from "../../types/gameLibrary";
import { GAME_LIBRARY_STATUS_LABELS } from "../../types/gameLibrary";
import styles from "./GameLibraryModal.module.css";

interface GameLibraryModalProps {
  game: GameCard;
  libraryEntry: GameLibraryEntry | undefined;
  onClose: () => void;
  onSave: (game: GameCard, data: { status: GameLibraryStatus; score: number }) => void;
  onRemove: (id: string) => void;
}

export function GameLibraryModal({ game, libraryEntry, onClose, onSave, onRemove }: GameLibraryModalProps) {
  const [status, setStatus] = useState<GameLibraryStatus>(libraryEntry?.status ?? "plan_to_play");
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
    onSave(game, { status, score });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>

        <div className={styles.header}>
          {game.backgroundImage ? (
            <img className={styles.coverImage} src={game.backgroundImage} alt={game.title} />
          ) : (
            <div className={styles.coverPlaceholder}>🎮</div>
          )}
          <div className={styles.title}>{game.title}</div>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Status</span>
            <select
              className={styles.controlSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as GameLibraryStatus)}
            >
              {Object.entries(GAME_LIBRARY_STATUS_LABELS).map(([key, label]) => (
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
