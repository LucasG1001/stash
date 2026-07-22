import { useState, useEffect, useCallback, useMemo } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { MediaGrid } from "../../components/MediaGrid/MediaGrid";
import { FranchiseGrid } from "../../components/FranchiseGrid/FranchiseGrid";
import { AnimeDrawer } from "../../components/AnimeDrawer/AnimeDrawer";
import { LibraryModal } from "../../components/LibraryModal/LibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { animeCardConfig } from "../../config/cards";
import { useAnime } from "../../hooks/useAnime";
import { useLibrary } from "../../hooks/useLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { AnimeCard } from "../../types/anime";
import type { AnimeDetail } from "../../types/anime";
import type { LibraryStatus } from "../../types/library";
import { LIBRARY_STATUS_LABELS } from "../../types/library";
import { SEASON_PT, getCurrentRealSeason, getSurroundingSeasons } from "../../utils/season";
import { getRecentYears } from "../../utils/year";
import { buildFranchiseGroups } from "../../utils/franchiseGroups";
import { libraryEntryToCard } from "../../utils/libraryEntryToCard";
import { filterGroupsByStatus } from "../../utils/filterGroupsByStatus";
import { filterGroupsByAiringStatus } from "../../utils/filterGroupsByAiringStatus";
import { filterGroupsBySearch } from "../../utils/filterGroupsBySearch";
import styles from "./AnimePage.module.css";

const TABS = [
  { id: "seasons", label: "Temporadas" },
  { id: "popular", label: "Mais Populares" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(LIBRARY_STATUS_LABELS) as [LibraryStatus, string][];

const AIRING_OPTIONS: [string, string][] = [
  ["RELEASING", "Em exibição"],
  ["FINISHED", "Finalizado"],
  ["NOT_YET_RELEASED", "Em breve"],
];

export function AnimePage() {
  const [activeTab, setActiveTab] = useState("seasons");
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [selectedAnimeForModal, setSelectedAnimeForModal] = useState<AnimeCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<LibraryStatus | "all">("all");
  const [airingFilter, setAiringFilter] = useState<string>("all");
  const [releaseSortDir, setReleaseSortDir] = useState<"desc" | "asc">("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedSeasonObj, setSelectedSeasonObj] = useState(getCurrentRealSeason());
  const [selectedPopularYear, setSelectedPopularYear] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { animes, loading, error, hasNextPage, loadSeason, loadPopular, search, loadMore, reset } = useAnime();
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
    findByAnilistId,
  } = useLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "seasons": loadSeason(selectedSeasonObj.season, selectedSeasonObj.year); break;
      case "popular": loadPopular(selectedPopularYear || undefined); break;
    }
  }, [activeTab, selectedSeasonObj, selectedPopularYear, loadSeason, loadPopular]);

  useEffect(() => {
    if (activeTab !== "search") return;
    if (debouncedSearch.length >= 2) search(debouncedSearch);
    else reset();
  }, [debouncedSearch, activeTab, search, reset]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setLibrarySearch("");
  };

  const handleCardClick = (anime: AnimeCard) => {
    setSelectedAnimeId(anime.id);
  };

  const handleOpenLibraryModal = useCallback((anime: AnimeCard) => {
    setSelectedAnimeForModal(anime);
  }, []);

  const handleModalSave = useCallback((anime: AnimeCard, data: { status: LibraryStatus; score: number; isRewatching: boolean }) => {
    const existing = findByAnilistId(anime.id);
    if (existing) {
      updateEntry(existing.id, { status: data.status, score: data.score, isRewatching: data.isRewatching, animeStatus: anime.status });
    } else {
      addEntry({
        anilistId: anime.id,
        title: anime.title,
        coverImage: anime.coverImage,
        totalEpisodes: anime.episodes ?? undefined,
        animeStatus: anime.status,
        seasonYear: anime.seasonYear,
        nextAiringEpisode: anime.nextAiringEpisode,
        streamingLinks: anime.streamingLinks,
        status: data.status,
        score: data.score,
      });
    }
    setSelectedAnimeForModal(null);
  }, [findByAnilistId, updateEntry, addEntry]);

  const handleModalRemove = useCallback((id: string) => {
    removeEntry(id);
    setSelectedAnimeForModal(null);
  }, [removeEntry]);

  const handleAnimeLoad = useCallback((animeDetail: AnimeDetail) => {
    const entry = findByAnilistId(animeDetail.id);
    if (entry) {
      const animeEpisodes = animeDetail.episodes ?? null;
      const needsUpdate =
        entry.animeStatus !== animeDetail.status ||
        entry.totalEpisodes !== animeEpisodes ||
        entry.title !== animeDetail.title ||
        entry.coverImage !== animeDetail.coverImage;

      if (needsUpdate) {
        updateEntry(entry.id, {
          title: animeDetail.title,
          coverImage: animeDetail.coverImage,
          totalEpisodes: animeEpisodes,
          animeStatus: animeDetail.status,
        });
      }
    }
  }, [findByAnilistId, updateEntry]);

  const franchiseGroups = useMemo(() => filterGroupsBySearch(
    filterGroupsByAiringStatus(
      filterGroupsByStatus(
        buildFranchiseGroups(libraryEntries, releaseSortDir),
        libraryFilter,
        (member, filter) => filter === "plan_to_watch" && member.isRewatching
      ),
      airingFilter
    ),
    librarySearch
  ), [libraryEntries, releaseSortDir, libraryFilter, airingFilter, librarySearch]);

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${airingFilter}-${releaseSortDir}-${librarySearch}`
      : activeTab === "seasons"
      ? `seasons-${selectedSeasonObj.season}-${selectedSeasonObj.year}`
      : activeTab === "search"
      ? `search-${debouncedSearch}`
      : activeTab === "popular"
      ? `popular-${selectedPopularYear}`
      : activeTab;

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>Anime</h1>

      <div className={styles.tabWrapper}>
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === "seasons" && (
        <div className={styles.seasonSelectorWrapper}>
          <select
            className={styles.seasonSelect}
            value={`${selectedSeasonObj.season}-${selectedSeasonObj.year}`}
            onChange={(e) => {
              const [s, y] = e.target.value.split("-");
              setSelectedSeasonObj({ season: s, year: parseInt(y) });
            }}
          >
            {getSurroundingSeasons(selectedSeasonObj.season, selectedSeasonObj.year).map(s => (
              <option key={`${s.season}-${s.year}`} value={`${s.season}-${s.year}`}>
                {SEASON_PT[s.season]} {s.year}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTab === "popular" && (
        <div className={styles.seasonSelectorWrapper}>
          <select
            className={styles.seasonSelect}
            value={selectedPopularYear}
            onChange={(e) => setSelectedPopularYear(parseInt(e.target.value))}
          >
            <option value={0}>Todos os anos</option>
            {getRecentYears().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTab === "search" && (
        <div className={styles.searchWrapper}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} loading={loading && searchQuery.length > 0} />
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
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => setFiltersOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            <span>Filtros</span>
          </button>
          {franchiseGroups.length > 0 && (
            <span className={styles.libraryCount}>
              <span className={styles.libraryCountNum}>{franchiseGroups.length}</span>
              <span className={styles.libraryCountWord}>
                {franchiseGroups.length === 1 ? " resultado" : " resultados"}
              </span>
            </span>
          )}
          {filtersOpen && <div className={styles.filterOverlay} onClick={() => setFiltersOpen(false)} />}
          <div className={`${styles.filterWrapper} ${filtersOpen ? styles.filterWrapperOpen : ""}`}>
          <div className={styles.filterSheetHeader}>
            <span>Filtros</span>
            <button type="button" className={styles.filterSheetClose} onClick={() => setFiltersOpen(false)}>
              ✕
            </button>
          </div>
          <select
            className={styles.seasonSelect}
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value as LibraryStatus | "all")}
          >
            <option value="all">Todos</option>
            {STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
          <select
            className={styles.seasonSelect}
            value={airingFilter}
            onChange={(e) => setAiringFilter(e.target.value)}
          >
            <option value="all">Toda exibição</option>
            {AIRING_OPTIONS.map(([status, label]) => (
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
          </div>
        </div>
      )}

      {activeTab === "library" ? (
        <FranchiseGrid
          groups={franchiseGroups}
          loading={libraryLoading}
          error={libraryError}
          cardConfig={animeCardConfig}
          entryToCard={libraryEntryToCard}
          getExternalId={(e) => e.anilistId}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByAnilistId(id)}
          onDeleteGroup={(group) => removeManyEntries(group.members.map((m) => m.id))}
          statusLabels={LIBRARY_STATUS_LABELS}
          onBulkSetStatus={(ids, status) => updateManyEntries(ids, status)}
          expandTitle="Ver temporadas, OVAs e filmes"
          animationKey={gridKey}
          emptyMessage="Sua biblioteca está vazia."
          emptyHint="Adicione animes para começar!"
        />
      ) : (
        <MediaGrid
          items={animes}
          config={animeCardConfig}
          loading={loading}
          error={error}
          hasNextPage={hasNextPage}
          onLoadMore={loadMore}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByAnilistId(id)}
          isLibraryView={false}
          animationKey={gridKey}
          emptyMessage={
            activeTab === "search" && searchQuery.length < 2
              ? "Digite pelo menos 2 caracteres para buscar."
              : "Nenhum anime encontrado."
          }
        />
      )}

      {selectedAnimeId !== null && (
        <AnimeDrawer
          animeId={selectedAnimeId}
          onClose={() => setSelectedAnimeId(null)}
          onAnimeLoad={handleAnimeLoad}
        />
      )}

      {selectedAnimeForModal !== null && (
        <LibraryModal
          anime={selectedAnimeForModal}
          libraryEntry={findByAnilistId(selectedAnimeForModal.id)}
          onClose={() => setSelectedAnimeForModal(null)}
          onSave={handleModalSave}
          onRemove={handleModalRemove}
          onSetCover={(id) => {
            setCoverEntry(id);
            setSelectedAnimeForModal(null);
          }}
        />
      )}
    </div>
  );
}
