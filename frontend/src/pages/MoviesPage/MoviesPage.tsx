import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { MovieGrid } from "../../components/MovieGrid/MovieGrid";
import { MovieFranchiseGrid } from "../../components/MovieFranchiseGrid/MovieFranchiseGrid";
import { MovieDrawer } from "../../components/MovieDrawer/MovieDrawer";
import { MovieLibraryModal } from "../../components/MovieLibraryModal/MovieLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { useMovies } from "../../hooks/useMovies";
import { useMovieLibrary } from "../../hooks/useMovieLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { MovieCard, MovieDetail } from "../../types/movie";
import type { MovieLibraryStatus } from "../../types/movieLibrary";
import { MOVIE_LIBRARY_STATUS_LABELS } from "../../types/movieLibrary";
import { MONTH_PT } from "../../utils/month";
import { getCurrentYear, getRecentYears } from "../../utils/year";
import { nextScoreSortDir, type ScoreSortDir } from "../../utils/librarySort";
import { buildMovieCollectionGroups } from "../../utils/movieCollectionGroups";
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
  const [releaseSortDir, setReleaseSortDir] = useState<"desc" | "asc">("desc");
  const [scoreSortDir, setScoreSortDir] = useState<ScoreSortDir>("off");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
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
      case "popular": loadPopular(selectedYear, selectedMonth); break;
      case "now_playing": loadNowPlaying(); break;
    }
  }, [activeTab, selectedYear, selectedMonth, loadPopular, loadNowPlaying]);

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
    ? libraryEntries.filter(entry => entry.status !== "dropped")
    : libraryEntries.filter(entry => entry.status === libraryFilter);

  const collectionGroups = buildMovieCollectionGroups(filteredLibraryEntries, scoreSortDir, releaseSortDir);

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${releaseSortDir}-${scoreSortDir}`
      : activeTab === "search"
      ? `search-${debouncedSearch}`
      : activeTab === "popular"
      ? `popular-${selectedYear}-${selectedMonth}`
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
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {getRecentYears().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            <option value={0}>Ano inteiro</option>
            {MONTH_PT.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
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
          <button
            className={styles.sortButton}
            onClick={() => setReleaseSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
            title={releaseSortDir === "desc" ? "Mais recentes primeiro" : "Mais antigas primeiro"}
          >
            <span>Data de lançamento</span>
            <span className={`${styles.sortIcon} ${releaseSortDir === "asc" ? styles.sortIconAsc : ""}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
          </button>
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

      {activeTab === "library" ? (
        <MovieFranchiseGrid
          groups={collectionGroups}
          loading={libraryLoading}
          error={libraryError}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByTmdbId(id)}
          animationKey={gridKey}
          emptyMessage="Sua biblioteca está vazia."
        />
      ) : (
        <MovieGrid
          movies={movies}
          loading={loading}
          error={error}
          hasNextPage={hasNextPage}
          onLoadMore={loadMore}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByTmdbId(id)}
          isLibraryView={false}
          animationKey={gridKey}
          emptyMessage={
            activeTab === "search" && searchQuery.length < 2
              ? "Digite pelo menos 2 caracteres para buscar."
              : "Nenhum filme encontrado."
          }
        />
      )}

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
