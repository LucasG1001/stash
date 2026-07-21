import { useState, useEffect, useCallback, useMemo } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { MediaGrid } from "../../components/MediaGrid/MediaGrid";
import { seriesCardConfig } from "../../config/cards";
import { SeriesDrawer } from "../../components/SeriesDrawer/SeriesDrawer";
import { SeriesLibraryModal } from "../../components/SeriesLibraryModal/SeriesLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { ResultCount } from "../../components/ResultCount/ResultCount";
import { useSeries } from "../../hooks/useSeries";
import { useSeriesLibrary } from "../../hooks/useSeriesLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { SeriesCard, SeriesDetail } from "../../types/series";
import type { SeriesLibraryStatus } from "../../types/seriesLibrary";
import { SERIES_LIBRARY_STATUS_LABELS } from "../../types/seriesLibrary";
import { MONTH_PT } from "../../utils/month";
import { getCurrentYear, getRecentYears } from "../../utils/year";
import { nextScoreSortDir, compareByScore, type ScoreSortDir } from "../../utils/librarySort";
import styles from "./SeriesPage.module.css";

const TABS = [
  { id: "popular", label: "Mais Populares" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(SERIES_LIBRARY_STATUS_LABELS) as [SeriesLibraryStatus, string][];

export function SeriesPage() {
  const [activeTab, setActiveTab] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedSeriesForModal, setSelectedSeriesForModal] = useState<SeriesCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<SeriesLibraryStatus | "all">("all");
  const [releaseSortDir, setReleaseSortDir] = useState<"desc" | "asc">("desc");
  const [scoreSortDir, setScoreSortDir] = useState<ScoreSortDir>("off");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { series, loading, error, hasNextPage, loadPopular, search, loadMore, reset } = useSeries();
  const {
    entries: libraryEntries,
    loading: libraryLoading,
    error: libraryError,
    add: addEntry,
    update: updateEntry,
    updateMany: updateManyEntries,
    remove: removeEntry,
    findByTmdbId,
  } = useSeriesLibrary();

  useEffect(() => {
    if (activeTab === "popular") {
      loadPopular(selectedYear, selectedMonth);
    }
  }, [activeTab, selectedYear, selectedMonth, loadPopular]);

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

  const handleCardClick = (item: SeriesCard) => {
    setSelectedSeriesId(item.id);
  };

  const handleOpenLibraryModal = useCallback((item: SeriesCard) => {
    setSelectedSeriesForModal(item);
  }, []);

  const handleModalSave = useCallback((item: SeriesCard, data: { status: SeriesLibraryStatus; score: number; isRewatching: boolean }) => {
    const existing = findByTmdbId(item.id);
    if (existing) {
      updateEntry(existing.id, { status: data.status, score: data.score, isRewatching: data.isRewatching, seriesStatus: item.seriesStatus });
    } else {
      addEntry({
        tmdbId: item.id,
        title: item.title,
        posterImage: item.posterImage,
        firstAirDate: item.firstAirDate,
        seriesStatus: item.seriesStatus,
        status: data.status,
        score: data.score,
      });
    }
    setSelectedSeriesForModal(null);
  }, [findByTmdbId, updateEntry, addEntry]);

  const handleModalRemove = useCallback((id: string) => {
    removeEntry(id);
    setSelectedSeriesForModal(null);
  }, [removeEntry]);

  const handleSeriesLoad = useCallback((seriesDetail: SeriesDetail) => {
    const entry = findByTmdbId(seriesDetail.id);
    if (entry) {
      const needsUpdate =
        entry.seriesStatus !== seriesDetail.seriesStatus ||
        entry.seasons !== seriesDetail.seasons ||
        entry.episodes !== seriesDetail.episodes ||
        entry.firstAirDate !== seriesDetail.firstAirDate ||
        entry.title !== seriesDetail.title ||
        entry.posterImage !== seriesDetail.posterImage;

      if (needsUpdate) {
        updateEntry(entry.id, {
          title: seriesDetail.title,
          posterImage: seriesDetail.posterImage,
          seasons: seriesDetail.seasons,
          episodes: seriesDetail.episodes,
          firstAirDate: seriesDetail.firstAirDate,
          seriesStatus: seriesDetail.seriesStatus,
        });
      }
    }
  }, [findByTmdbId, updateEntry]);

  const librarySeriesCards = useMemo<SeriesCard[]>(() => {
    const statusLibraryEntries = libraryFilter === "all"
      ? libraryEntries.filter(entry => entry.status !== "dropped")
      : libraryEntries.filter(entry => entry.status === libraryFilter || (libraryFilter === "plan_to_watch" && entry.isRewatching));

    const searchTerm = librarySearch.trim().toLowerCase();
    const filteredLibraryEntries = searchTerm
      ? statusLibraryEntries.filter(entry => entry.title.toLowerCase().includes(searchTerm))
      : statusLibraryEntries;

    const sortedLibraryEntries = scoreSortDir !== "off"
      ? [...filteredLibraryEntries].sort((a, b) => compareByScore(a, b, scoreSortDir))
      : [...filteredLibraryEntries].sort((a, b) => {
          const ta = a.firstAirDate ? new Date(a.firstAirDate).getTime() : 0;
          const tb = b.firstAirDate ? new Date(b.firstAirDate).getTime() : 0;
          const diff = ta - tb;
          return releaseSortDir === "desc" ? -diff : diff;
        });

    return sortedLibraryEntries.map((entry) => ({
      id: entry.tmdbId,
      title: entry.title,
      posterImage: entry.posterImage ?? "",
      backdropImage: null,
      firstAirDate: entry.firstAirDate,
      voteAverage: null,
      overview: null,
      seriesStatus: entry.seriesStatus || "RELEASED",
    }));
  }, [libraryEntries, libraryFilter, librarySearch, scoreSortDir, releaseSortDir]);

  const displaySeries = activeTab === "library" ? librarySeriesCards : series;
  const displayLoading = activeTab === "library" ? libraryLoading : loading;
  const displayError = activeTab === "library" ? libraryError : error;

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${releaseSortDir}-${scoreSortDir}-${librarySearch}`
      : activeTab === "search"
      ? `search-${debouncedSearch}`
      : `popular-${selectedYear}-${selectedMonth}`;

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>Séries</h1>

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
          {displaySeries.length > 0 && <ResultCount count={displaySeries.length} />}
        </div>
      )}

      {activeTab === "search" && (
        <div className={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            loading={loading && searchQuery.length > 0}
            placeholder="Buscar série..."
          />
          {displaySeries.length > 0 && <ResultCount count={displaySeries.length} />}
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
            onChange={(e) => setLibraryFilter(e.target.value as SeriesLibraryStatus | "all")}
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
          {displaySeries.length > 0 && <ResultCount count={displaySeries.length} />}
        </div>
      )}

      <MediaGrid
        items={displaySeries}
        config={seriesCardConfig}
        loading={displayLoading}
        error={displayError}
        hasNextPage={activeTab !== "library" && hasNextPage}
        onLoadMore={loadMore}
        onCardClick={handleCardClick}
        onAddToLibrary={handleOpenLibraryModal}
        getLibraryEntry={(id) => findByTmdbId(id)}
        isLibraryView={activeTab === "library"}
        statusLabels={SERIES_LIBRARY_STATUS_LABELS}
        onBulkSetStatus={(ids, status) => updateManyEntries(ids, status)}
        animationKey={gridKey}
        emptyMessage={
          activeTab === "library"
            ? "Sua biblioteca está vazia. Adicione séries para começar!"
            : activeTab === "search" && searchQuery.length < 2
            ? "Digite pelo menos 2 caracteres para buscar."
            : "Nenhuma série encontrada."
        }
      />

      {selectedSeriesId !== null && (
        <SeriesDrawer
          seriesId={selectedSeriesId}
          onClose={() => setSelectedSeriesId(null)}
          onSeriesLoad={handleSeriesLoad}
        />
      )}

      {selectedSeriesForModal !== null && (
        <SeriesLibraryModal
          series={selectedSeriesForModal}
          libraryEntry={findByTmdbId(selectedSeriesForModal.id)}
          onClose={() => setSelectedSeriesForModal(null)}
          onSave={handleModalSave}
          onRemove={handleModalRemove}
        />
      )}
    </div>
  );
}
