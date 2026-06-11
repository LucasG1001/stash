import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { MovieGrid } from "../../components/MovieGrid/MovieGrid";
import { MovieDrawer } from "../../components/MovieDrawer/MovieDrawer";
import { MovieLibraryModal } from "../../components/MovieLibraryModal/MovieLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { useMovies } from "../../hooks/useMovies";
import { useMovieLibrary } from "../../hooks/useMovieLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { MovieCard, MovieDetail } from "../../types/movie";
import type { MovieLibraryStatus } from "../../types/movieLibrary";
import { MOVIE_LIBRARY_STATUS_LABELS } from "../../types/movieLibrary";
import { MONTH_PT, getCurrentMonth, getLast12Months } from "../../utils/month";
import styles from "./MoviesPage.module.css";

const TABS = [
  { id: "popular", label: "Mais Populares" },
  { id: "now_playing", label: "Em Cartaz" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(MOVIE_LIBRARY_STATUS_LABELS) as [MovieLibraryStatus, string][];

export function MoviesPage() {
  const [activeTab, setActiveTab] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMovieForModal, setSelectedMovieForModal] = useState<MovieCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<MovieLibraryStatus | "all">("all");
  const [watchedSortDir, setWatchedSortDir] = useState<"desc" | "asc">("desc");
  const [selectedMonthObj, setSelectedMonthObj] = useState(getCurrentMonth());
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { movies, loading, error, hasNextPage, loadPopular, loadNowPlaying, search, loadMore } = useMovies();
  const {
    entries: libraryEntries,
    loading: libraryLoading,
    error: libraryError,
    add: addEntry,
    update: updateEntry,
    remove: removeEntry,
    findByTmdbId,
  } = useMovieLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "popular": loadPopular(selectedMonthObj.month, selectedMonthObj.year); break;
      case "now_playing": loadNowPlaying(); break;
    }
  }, [activeTab, selectedMonthObj, loadPopular, loadNowPlaying]);

  useEffect(() => {
    if (activeTab === "search" && debouncedSearch.length >= 2) {
      search(debouncedSearch);
    }
  }, [debouncedSearch, activeTab, search]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery("");
  };

  const handleCardClick = (movie: MovieCard) => {
    setSelectedMovieId(movie.id);
  };

  const handleOpenLibraryModal = useCallback((movie: MovieCard) => {
    setSelectedMovieForModal(movie);
  }, []);

  const handleModalSave = useCallback((movie: MovieCard, data: { status: MovieLibraryStatus; score: number }) => {
    const existing = findByTmdbId(movie.id);
    if (existing) {
      updateEntry(existing.id, { ...data, movieStatus: movie.movieStatus });
    } else {
      addEntry({
        tmdbId: movie.id,
        title: movie.title,
        posterImage: movie.posterImage,
        releaseDate: movie.releaseDate,
        movieStatus: movie.movieStatus,
        ...data,
      });
    }
    setSelectedMovieForModal(null);
  }, [findByTmdbId, updateEntry, addEntry]);

  const handleModalRemove = useCallback((id: string) => {
    removeEntry(id);
    setSelectedMovieForModal(null);
  }, [removeEntry]);

  const handleMovieLoad = useCallback((movieDetail: MovieDetail) => {
    const entry = findByTmdbId(movieDetail.id);
    if (entry) {
      const needsUpdate =
        entry.movieStatus !== movieDetail.movieStatus ||
        entry.runtime !== movieDetail.runtime ||
        entry.releaseDate !== movieDetail.releaseDate ||
        entry.title !== movieDetail.title ||
        entry.posterImage !== movieDetail.posterImage;

      if (needsUpdate) {
        updateEntry(entry.id, {
          title: movieDetail.title,
          posterImage: movieDetail.posterImage,
          runtime: movieDetail.runtime,
          releaseDate: movieDetail.releaseDate,
          movieStatus: movieDetail.movieStatus,
        });
      }
    }
  }, [findByTmdbId, updateEntry]);

  const filteredLibraryEntries = libraryFilter === "all"
    ? libraryEntries
    : libraryEntries.filter(entry => entry.status === libraryFilter);

  const showWatchedSort = libraryFilter === "watched";

  const sortedLibraryEntries = showWatchedSort
    ? [...filteredLibraryEntries].sort((a, b) => {
        const ta = a.watchedAt ? new Date(a.watchedAt).getTime() : 0;
        const tb = b.watchedAt ? new Date(b.watchedAt).getTime() : 0;
        const diff = ta - tb;
        return watchedSortDir === "desc" ? -diff : diff;
      })
    : filteredLibraryEntries;

  const libraryMovieCards: MovieCard[] = sortedLibraryEntries.map((entry) => ({
    id: entry.tmdbId,
    title: entry.title,
    posterImage: entry.posterImage ?? "",
    backdropImage: null,
    releaseDate: entry.releaseDate,
    voteAverage: null,
    overview: null,
    movieStatus: entry.movieStatus || "RELEASED",
  }));

  const displayMovies = activeTab === "library" ? libraryMovieCards : movies;
  const displayLoading = activeTab === "library" ? libraryLoading : loading;
  const displayError = activeTab === "library" ? libraryError : error;

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${watchedSortDir}`
      : activeTab === "search"
      ? `search-${debouncedSearch}`
      : activeTab === "popular"
      ? `popular-${selectedMonthObj.month}-${selectedMonthObj.year}`
      : activeTab;

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>Filmes</h1>

      <div className={styles.tabWrapper}>
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === "popular" && (
        <div className={styles.selectorWrapper}>
          <select
            className={styles.filterSelect}
            value={`${selectedMonthObj.month}-${selectedMonthObj.year}`}
            onChange={(e) => {
              const [m, y] = e.target.value.split("-");
              setSelectedMonthObj({ month: parseInt(m), year: parseInt(y) });
            }}
          >
            {getLast12Months().map((m) => (
              <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                {MONTH_PT[m.month - 1]} {m.year}
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
            placeholder="Buscar filme..."
          />
        </div>
      )}

      {activeTab === "library" && (
        <div className={styles.filterWrapper}>
          <select
            className={styles.filterSelect}
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value as MovieLibraryStatus | "all")}
          >
            <option value="all">Todos</option>
            {STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
          {showWatchedSort && (
            <button
              className={styles.sortButton}
              onClick={() => setWatchedSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
              title={watchedSortDir === "desc" ? "Mais recentes primeiro" : "Mais antigas primeiro"}
            >
              <span>Data assistida</span>
              <span className={`${styles.sortIcon} ${watchedSortDir === "asc" ? styles.sortIconAsc : ""}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </span>
            </button>
          )}
        </div>
      )}

      <MovieGrid
        movies={displayMovies}
        loading={displayLoading}
        error={displayError}
        hasNextPage={activeTab !== "library" && hasNextPage}
        onLoadMore={loadMore}
        onCardClick={handleCardClick}
        onAddToLibrary={handleOpenLibraryModal}
        getLibraryEntry={(id) => findByTmdbId(id)}
        isLibraryView={activeTab === "library"}
        animationKey={gridKey}
        emptyMessage={
          activeTab === "library"
            ? "Sua biblioteca está vazia. Adicione filmes para começar!"
            : activeTab === "search" && searchQuery.length < 2
            ? "Digite pelo menos 2 caracteres para buscar."
            : "Nenhum filme encontrado."
        }
      />

      {selectedMovieId !== null && (
        <MovieDrawer
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
          onMovieLoad={handleMovieLoad}
        />
      )}

      {selectedMovieForModal !== null && (
        <MovieLibraryModal
          movie={selectedMovieForModal}
          libraryEntry={findByTmdbId(selectedMovieForModal.id)}
          onClose={() => setSelectedMovieForModal(null)}
          onSave={handleModalSave}
          onRemove={handleModalRemove}
        />
      )}
    </div>
  );
}
