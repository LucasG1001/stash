import styles from "./LoadingSkeleton.module.css";

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 12 }: LoadingSkeletonProps) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${styles.skeleton} ${styles.card}`} />
      ))}
    </div>
  );
}
