import styles from "./SelectionBar.module.css";

interface SelectionBarProps {
  count: number;
  statusLabels: Record<string, string>;
  onApply: (status: string) => void;
  onClear: () => void;
}

export function SelectionBar({ count, statusLabels, onApply, onClear }: SelectionBarProps) {
  if (count === 0) return null;
  return (
    <div className={styles.bar} role="toolbar" aria-label="Ações de seleção">
      <button type="button" className={styles.close} onClick={onClear} aria-label="Cancelar seleção">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <span className={styles.count}>{count} selecionado{count > 1 ? "s" : ""}</span>
      <div className={styles.actions}>
        {Object.entries(statusLabels).map(([status, label]) => (
          <button key={status} type="button" className={styles.statusButton} onClick={() => onApply(status)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
