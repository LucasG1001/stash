import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { BookGrid } from "../../components/BookGrid/BookGrid";
import { BookDrawer } from "../../components/BookDrawer/BookDrawer";
import { BookLibraryModal } from "../../components/BookLibraryModal/BookLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { useBooks } from "../../hooks/useBooks";
import { useBookLibrary } from "../../hooks/useBookLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { BookCard, BookDetail } from "../../types/book";
import type { BookLibraryStatus } from "../../types/bookLibrary";
import { BOOK_LIBRARY_STATUS_LABELS } from "../../types/bookLibrary";
import { BOOK_GENRES } from "../../utils/bookGenres";
import { nextScoreSortDir, compareByScore, type ScoreSortDir } from "../../utils/librarySort";
import styles from "./BooksPage.module.css";

const TABS = [
  { id: "discover", label: "Descobrir" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(BOOK_LIBRARY_STATUS_LABELS) as [BookLibraryStatus, string][];

export function BooksPage() {
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBookForModal, setSelectedBookForModal] = useState<BookCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<BookLibraryStatus | "all">("all");
  const [readSortDir, setReadSortDir] = useState<"desc" | "asc">("desc");
  const [scoreSortDir, setScoreSortDir] = useState<ScoreSortDir>("off");
  const [selectedGenre, setSelectedGenre] = useState(BOOK_GENRES[0].value);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { books, loading, error, hasNextPage, loadByGenre, search, loadMore } = useBooks();
  const {
    entries: libraryEntries,
    loading: libraryLoading,
    error: libraryError,
    add: addEntry,
    update: updateEntry,
    remove: removeEntry,
    findByGoogleBooksId,
  } = useBookLibrary();

  useEffect(() => {
    if (activeTab === "discover") {
      loadByGenre(selectedGenre);
    }
  }, [activeTab, selectedGenre, loadByGenre]);

  useEffect(() => {
    if (activeTab === "search" && debouncedSearch.length >= 2) {
      search(debouncedSearch);
    }
  }, [debouncedSearch, activeTab, search]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery("");
  };

  const handleCardClick = (book: BookCard) => {
    setSelectedBookId(book.id);
  };

  const handleOpenLibraryModal = useCallback((book: BookCard) => {
    setSelectedBookForModal(book);
  }, []);

  const handleModalSave = useCallback((book: BookCard, data: { status: BookLibraryStatus; score: number }) => {
    const existing = findByGoogleBooksId(book.id);
    if (existing) {
      updateEntry(existing.id, data);
    } else {
      addEntry({
        googleBooksId: book.id,
        title: book.title,
        coverImage: book.coverImage,
        authors: book.authors.length > 0 ? book.authors.join(", ") : null,
        publishedDate: book.publishedDate,
        ...data,
      });
    }
    setSelectedBookForModal(null);
  }, [findByGoogleBooksId, updateEntry, addEntry]);

  const handleModalRemove = useCallback((id: string) => {
    removeEntry(id);
    setSelectedBookForModal(null);
  }, [removeEntry]);

  const handleBookLoad = useCallback((bookDetail: BookDetail) => {
    const entry = findByGoogleBooksId(bookDetail.id);
    if (entry) {
      const authorsStr = bookDetail.authors.length > 0 ? bookDetail.authors.join(", ") : null;
      const needsUpdate =
        entry.title !== bookDetail.title ||
        entry.coverImage !== bookDetail.coverImage ||
        entry.authors !== authorsStr ||
        entry.publishedDate !== bookDetail.publishedDate ||
        entry.pageCount !== bookDetail.pageCount;

      if (needsUpdate) {
        updateEntry(entry.id, {
          title: bookDetail.title,
          coverImage: bookDetail.coverImage,
          authors: authorsStr,
          publishedDate: bookDetail.publishedDate,
          pageCount: bookDetail.pageCount,
        });
      }
    }
  }, [findByGoogleBooksId, updateEntry]);

  const filteredLibraryEntries = libraryFilter === "all"
    ? libraryEntries.filter(entry => entry.status !== "dropped")
    : libraryEntries.filter(entry => entry.status === libraryFilter);

  const showReadSort = libraryFilter === "read";

  const sortedLibraryEntries = scoreSortDir !== "off"
    ? [...filteredLibraryEntries].sort((a, b) => compareByScore(a, b, scoreSortDir))
    : showReadSort
    ? [...filteredLibraryEntries].sort((a, b) => {
        const ta = a.readAt ? new Date(a.readAt).getTime() : 0;
        const tb = b.readAt ? new Date(b.readAt).getTime() : 0;
        const diff = ta - tb;
        return readSortDir === "desc" ? -diff : diff;
      })
    : filteredLibraryEntries;

  const libraryBookCards: BookCard[] = sortedLibraryEntries.map((entry) => ({
    id: entry.googleBooksId,
    title: entry.title,
    coverImage: entry.coverImage,
    authors: entry.authors ? entry.authors.split(", ") : [],
    publishedDate: entry.publishedDate,
    averageRating: null,
    ratingsCount: null,
  }));

  const displayBooks = activeTab === "library" ? libraryBookCards : books;
  const displayLoading = activeTab === "library" ? libraryLoading : loading;
  const displayError = activeTab === "library" ? libraryError : error;

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${readSortDir}-${scoreSortDir}`
      : activeTab === "search"
      ? `search-${debouncedSearch}`
      : `discover-${selectedGenre}`;

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>Livros</h1>

      <div className={styles.tabWrapper}>
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === "discover" && (
        <div className={styles.selectorWrapper}>
          <select
            className={styles.filterSelect}
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            {BOOK_GENRES.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTab === "search" && (
        <div className={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            loading={loading && searchQuery.length > 0}
            placeholder="Buscar livro..."
          />
        </div>
      )}

      {activeTab === "library" && (
        <div className={styles.filterWrapper}>
          <select
            className={styles.filterSelect}
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value as BookLibraryStatus | "all")}
          >
            <option value="all">Todos</option>
            {STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
          {showReadSort && (
            <button
              className={styles.sortButton}
              onClick={() => setReadSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
              title={readSortDir === "desc" ? "Mais recentes primeiro" : "Mais antigas primeiro"}
            >
              <span>Data de leitura</span>
              <span className={`${styles.sortIcon} ${readSortDir === "asc" ? styles.sortIconAsc : ""}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </span>
            </button>
          )}
          <button
            className={`${styles.sortButton} ${scoreSortDir !== "off" ? styles.sortButtonActive : ""}`}
            onClick={() => setScoreSortDir(nextScoreSortDir(scoreSortDir))}
            title={
              scoreSortDir === "off"
                ? "Ordenar por nota"
                : scoreSortDir === "desc"
                ? "Maior nota primeiro"
                : "Menor nota primeiro"
            }
          >
            <span>Nota</span>
            {scoreSortDir !== "off" && (
              <span className={`${styles.sortIcon} ${scoreSortDir === "asc" ? styles.sortIconAsc : ""}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}

      <BookGrid
        books={displayBooks}
        loading={displayLoading}
        error={displayError}
        hasNextPage={activeTab !== "library" && hasNextPage}
        onLoadMore={loadMore}
        onCardClick={handleCardClick}
        onAddToLibrary={handleOpenLibraryModal}
        getLibraryEntry={(id) => findByGoogleBooksId(id)}
        isLibraryView={activeTab === "library"}
        animationKey={gridKey}
        emptyMessage={
          activeTab === "library"
            ? "Sua biblioteca está vazia. Adicione livros para começar!"
            : activeTab === "search" && searchQuery.length < 2
            ? "Digite pelo menos 2 caracteres para buscar."
            : "Nenhum livro encontrado."
        }
      />

      {selectedBookId !== null && (
        <BookDrawer
          bookId={selectedBookId}
          onClose={() => setSelectedBookId(null)}
          onBookLoad={handleBookLoad}
        />
      )}

      {selectedBookForModal !== null && (
        <BookLibraryModal
          book={selectedBookForModal}
          libraryEntry={findByGoogleBooksId(selectedBookForModal.id)}
          onClose={() => setSelectedBookForModal(null)}
          onSave={handleModalSave}
          onRemove={handleModalRemove}
        />
      )}
    </div>
  );
}
