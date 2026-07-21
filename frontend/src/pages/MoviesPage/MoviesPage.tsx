import { useState, useEffect, useCallback, useMemo } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { MediaGrid } from "../../components/MediaGrid/MediaGrid";
import { FranchiseGrid } from "../../components/FranchiseGrid/FranchiseGrid";
import { MovieDrawer } from "../../components/MovieDrawer/MovieDrawer";
import { MovieLibraryModal } from "../../components/MovieLibraryModal/MovieLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { ResultCount } from "../../components/ResultCount/ResultCount";
import { movieCardConfig } from "../../config/cards";
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
import { movieLibraryEntryToCard } from "../../utils/movieLibraryEntryToCard";
import { filterGroupsByStatus } from "../../utils/filterGroupsByStatus";
import { filterGroupsBySearch } from "../../utils/filterGroupsBySearch";
import styles from "./MoviesPage.module.css";

const TABS = [
  { id: "popular", label: "Mais Populares" },
  { id: "now_playing", label: "Em Cartaz" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(MOVIE_LIBRARY_STATUS_LABELS) as [MovieLibraryStatus, string][];

export function MoviesPage() {
  const [activeTab, setActiveTab] = useState("now_playing");
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMovieForModal, setSelectedMovieForModal] = useState<MovieCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<MovieLibraryStatus | "all">("all");
  const [releaseSortDir, setReleaseSortDir] = useState<"desc" | "asc">("desc");
  const [scoreSortDir, setScoreSortDir] = useState<ScoreSortDir>("off");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { movies, loading, error, hasNextPage, loadPopular, loadNowPlaying, search, loadMore, reset } = useMovies();
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
    findByTmdbId,
  } = useMovieLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "popular": loadPopular(selectedYear, selectedMonth); break;
      case "now_playing": loadNowPlaying(); break;
    }
  }, [activeTab, selectedYear, selectedMonth, loadPopular, loadNowPlaying]);

  useEffect(() => {
    if (activeTab !== "search") return;
    if (debouncedSearch.length >= 2) search(debouncedSearch);
    else reset();
  }, [debouncedSearch, activeTab, search, reset]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setLibrarySearch("");
  };

  const handleCardClick = (movie: MovieCard) => {
    setSelectedMovieId(movie.id);
  };

  const handleOpenLibraryModal = useCallback((movie: MovieCard) => {
    setSelectedMovieForModal(movie);
  }, []);

  const handleModalSave = useCallback((movie: MovieCard, data: { status: MovieLibraryStatus; score: number; isRewatching: boolean }) => {
    const existing = findByTmdbId(movie.id);
    if (existing) {
      updateEntry(existing.id, { status: data.status, score: data.score, isRewatching: data.isRewatching, movieStatus: movie.movieStatus });
    } else {
      addEntry({
        tmdbId: movie.id,
        title: movie.title,
        posterImage: movie.posterImage,
        releaseDate: movie.releaseDate,
        movieStatus: movie.movieStatus,
        status: data.status,
        score: data.score,
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

  const collectionGroups = useMemo(() => filterGroupsBySearch(
    filterGroupsByStatus(
      buildMovieCollectionGroups(libraryEntries, scoreSortDir, releaseSortDir),
      libraryFilter,
      (member, filter) => filter === "plan_to_watch" && member.isRewatching
    ),
    librarySearch
  ), [libraryEntries, scoreSortDir, releaseSortDir, libraryFilter, librarySearch]);

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${releaseSortDir}-${scoreSortDir}-${librarySearch}`
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
          {movies.length > 0 && <ResultCount count={movies.length} />}
        </div>
      )}

      {activeTab === "now_playing" && movies.length > 0 && (
        <div className={styles.countBar}>
          <ResultCount count={movies.length} />
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
          {movies.length > 0 && <ResultCount count={movies.length} />}
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
            <span>Lançamento</span>
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
          {collectionGroups.length > 0 && <ResultCount count={collectionGroups.length} />}
        </div>
      )}

      {activeTab === "library" ? (
        <FranchiseGrid
          groups={collectionGroups}
          loading={libraryLoading}
          error={libraryError}
          cardConfig={movieCardConfig}
          entryToCard={movieLibraryEntryToCard}
          getExternalId={(e) => e.tmdbId}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByTmdbId(id)}
          onDeleteGroup={(group) => removeManyEntries(group.members.map((m) => m.id))}
          statusLabels={MOVIE_LIBRARY_STATUS_LABELS}
          onBulkSetStatus={(ids, status) => updateManyEntries(ids, status)}
          expandTitle="Ver filmes da coleção"
          animationKey={gridKey}
          emptyMessage="Sua biblioteca está vazia."
          emptyHint="Adicione filmes para começar!"
        />
      ) : (
        <MediaGrid
          items={movies}
          config={movieCardConfig}
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
          onSetCover={(id) => {
            setCoverEntry(id);
            setSelectedMovieForModal(null);
          }}
        />
      )}
    </div>
  );
}
