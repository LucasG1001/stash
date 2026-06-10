import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function SearchBar({ value, onChange, loading, placeholder = "Buscar anime..." }: SearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <span className={styles.icon}>🔍</span>
      {loading && <div className={styles.spinner} />}
    </div>
  );
}
