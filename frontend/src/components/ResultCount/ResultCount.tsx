import styles from "./ResultCount.module.css";

interface ResultCountProps {
  count: number;
}

export function ResultCount({ count }: ResultCountProps) {
  return (
    <span className={styles.count}>
      {count} {count === 1 ? "resultado" : "resultados"}
    </span>
  );
}
