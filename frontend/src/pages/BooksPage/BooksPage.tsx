import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { MediaGrid } from "../../components/MediaGrid/MediaGrid";
import { FranchiseGrid } from "../../components/FranchiseGrid/FranchiseGrid";
import { bookCardConfig } from "../../config/cards";
import { BookDrawer } from "../../components/BookDrawer/BookDrawer";
import { BookLibraryModal } from "../../components/BookLibraryModal/BookLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { ResultCount } from "../../components/ResultCount/ResultCount";
import { useBooks } from "../../hooks/useBooks";
import { useBookLibrary } from "../../hooks/useBookLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { BookCard, BookDetail } from "../../types/book";
import type { BookLibraryStatus } from "../../types/bookLibrary";
import { BOOK_LIBRARY_STATUS_LABELS } from "../../types/bookLibrary";
import { BOOK_GENRES } from "../../utils/bookGenres";
import { nextScoreSortDir, type ScoreSortDir } from "../../utils/librarySort";
import { buildBookCollectionGroups, authorKey } from "../../utils/bookCollectionGroups";
import { bookLibraryEntryToCard } from "../../utils/bookLibraryEntryToCard";
import { filterGroupsByStatus } from "../../utils/filterGroupsByStatus";
import { filterGroupsBySearch } from "../../utils/filterGroupsBySearch";
import styles from "./BooksPage.module.css";

const TABS = [
  { id: "discover", label: "Descobrir" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(BOOK_LIBRARY_STATUS_LABELS) as [BookLibraryStatus, string][];

export function BooksPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
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
    updateMany: updateManyEntries,
    setCover: setCoverEntry,
    remove: removeEntry,
    removeMany: removeManyEntries,
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
    setLibrarySearch("");
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

  const showReadSort = libraryFilter === "read";

  const collectionGroups = filterGroupsBySearch(
    filterGroupsByStatus(
      buildBookCollectionGroups(libraryEntries, scoreSortDir, readSortDir, showReadSort),
      libraryFilter
    ),
    librarySearch
  );

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${readSortDir}-${scoreSortDir}-${librarySearch}`
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
          {books.length > 0 && <ResultCount count={books.length} />}
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
          {books.length > 0 && <ResultCount count={books.length} />}
        </div>
      )}

      {activeTab === "library" && (
        <div className={styles.libraryControls}>
          <div className={styles.searchWrapper}>
            <SearchBar
              value={librarySearch}
              onChange={setLibrarySearch}
              placeholder="Buscar na biblioteca..."
            />
          </div>
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
              <span>Leitura</span>
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
          {collectionGroups.length > 0 && <ResultCount count={collectionGroups.length} />}
        </div>
      )}

      {activeTab === "library" ? (
        <FranchiseGrid
          groups={collectionGroups}
          loading={libraryLoading}
          error={libraryError}
          cardConfig={bookCardConfig}
          entryToCard={bookLibraryEntryToCard}
          getExternalId={(e) => e.googleBooksId}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByGoogleBooksId(id)}
          onDeleteGroup={(group) => removeManyEntries(group.members.map((m) => m.id))}
          statusLabels={BOOK_LIBRARY_STATUS_LABELS}
          onBulkSetStatus={(ids, status) => updateManyEntries(ids, status)}
          expandTitle="Ver livros do autor"
          animationKey={gridKey}
          emptyMessage="Sua biblioteca está vazia."
          emptyHint="Adicione livros para começar!"
        />
      ) : (
        <MediaGrid
          items={books}
          config={bookCardConfig}
          loading={loading}
          error={error}
          hasNextPage={hasNextPage}
          onLoadMore={loadMore}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByGoogleBooksId(id)}
          isLibraryView={false}
          animationKey={gridKey}
          emptyMessage={
            activeTab === "search" && searchQuery.length < 2
              ? "Digite pelo menos 2 caracteres para buscar."
              : "Nenhum livro encontrado."
          }
        />
      )}

      {selectedBookId !== null && (
        <BookDrawer
          bookId={selectedBookId}
          onClose={() => setSelectedBookId(null)}
          onBookLoad={handleBookLoad}
        />
      )}

      {selectedBookForModal !== null && (() => {
        const modalEntry = findByGoogleBooksId(selectedBookForModal.id);
        const modalAuthorKey = modalEntry ? authorKey(modalEntry) : null;
        const canSetCover =
          !!modalEntry &&
          modalAuthorKey !== null &&
          libraryEntries.filter((e) => authorKey(e) === modalAuthorKey).length > 1;
        return (
          <BookLibraryModal
            book={selectedBookForModal}
            libraryEntry={modalEntry}
            onClose={() => setSelectedBookForModal(null)}
            onSave={handleModalSave}
            onRemove={handleModalRemove}
            onSetCover={(id) => {
              setCoverEntry(id);
              setSelectedBookForModal(null);
            }}
            canSetCover={canSetCover}
          />
        );
      })()}
    </div>
  );
}
