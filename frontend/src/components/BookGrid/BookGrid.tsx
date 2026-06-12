import type { BookCard as BookCardType } from "../../types/book";
import type { BookLibraryEntry } from "../../types/bookLibrary";
import { BookCard } from "../BookCard/BookCard";
import { LoadingSkeleton } from "../LoadingSkeleton/LoadingSkeleton";
import styles from "./BookGrid.module.css";

interface BookGridProps {
  books: BookCardType[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onCardClick: (book: BookCardType) => void;
  onAddToLibrary: (book: BookCardType) => void;
  getLibraryEntry: (googleBooksId: string) => BookLibraryEntry | undefined;
  emptyMessage?: string;
  isLibraryView?: boolean;
  animationKey?: string;
}

export function BookGrid({
  books,
  loading,
  error,
  hasNextPage,
  onLoadMore,
  onCardClick,
  onAddToLibrary,
  getLibraryEntry,
  emptyMessage = "Nenhum livro encontrado.",
  isLibraryView,
  animationKey,
}: BookGridProps) {
  if (loading && books.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && books.length === 0) {
    return (
      <div className={styles.grid}>
        <div className={styles.errorState}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyTitle}>Ops!</div>
          <div className={styles.emptyText}>{error}</div>
        </div>
      </div>
    );
  }

  if (!loading && books.length === 0) {
    return (
      <div className={styles.grid}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>{emptyMessage}</div>
          <div className={styles.emptyText}>Tente uma busca diferente.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.grid} key={animationKey}>
      {books.map((book, index) => (
        <BookCard
          key={book.id}
          book={book}
          libraryEntry={getLibraryEntry(book.id)}
          onClick={() => onCardClick(book)}
          onAdd={() => onAddToLibrary(book)}
          isLibraryView={isLibraryView}
          index={index}
        />
      ))}

      {hasNextPage && (
        <div className={styles.loadMoreWrapper}>
          <button className={styles.loadMoreButton} onClick={onLoadMore} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}
