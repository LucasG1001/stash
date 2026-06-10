import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { AnimeGrid } from "../../components/AnimeGrid/AnimeGrid";
import { AnimeDrawer } from "../../components/AnimeDrawer/AnimeDrawer";
import { LibraryModal } from "../../components/LibraryModal/LibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { useAnime } from "../../hooks/useAnime";
import { useLibrary } from "../../hooks/useLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { AnimeCard } from "../../types/anime";
import type { AnimeDetail } from "../../types/anime";
import type { LibraryStatus } from "../../types/library";
import { LIBRARY_STATUS_LABELS } from "../../types/library";
import { SEASON_PT, getCurrentRealSeason, getSurroundingSeasons } from "../../utils/season";
import styles from "./AnimePage.module.css";

const TABS = [
  { id: "seasons", label: "Temporadas" },
  { id: "popular", label: "Mais Populares" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(LIBRARY_STATUS_LABELS) as [LibraryStatus, string][];

export function AnimePage() {
  const [activeTab, setActiveTab] = useState("seasons");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [selectedAnimeForModal, setSelectedAnimeForModal] = useState<AnimeCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<LibraryStatus | "all">("all");
  const [selectedSeasonObj, setSelectedSeasonObj] = useState(getCurrentRealSeason());
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { animes, loading, error, hasNextPage, loadSeason, loadPopular, search, loadMore } = useAnime();
  const {
    entries: libraryEntries,
    loading: libraryLoading,
    error: libraryError,
    add: addEntry,
    update: updateEntry,
    remove: removeEntry,
    findByAnilistId,
  } = useLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "seasons": loadSeason(selectedSeasonObj.season, selectedSeasonObj.year); break;
      case "popular": loadPopular(); break;
    }
  }, [activeTab, selectedSeasonObj, loadSeason, loadPopular]);

  useEffect(() => {
    if (activeTab === "search" && debouncedSearch.length >= 2) {
      search(debouncedSearch);
    }
  }, [debouncedSearch, activeTab, search]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery("");
  };

  const handleCardClick = (anime: AnimeCard) => {
    setSelectedAnimeId(anime.id);
  };

  const handleOpenLibraryModal = useCallback((anime: AnimeCard) => {
    setSelectedAnimeForModal(anime);
  }, []);

  const handleModalSave = useCallback((anime: AnimeCard, data: { status: LibraryStatus; score: number; watchedEpisodes: number }) => {
    const existing = findByAnilistId(anime.id);
    if (existing) {
      updateEntry(existing.id, { ...data, animeStatus: anime.status });
    } else {
      addEntry({
        anilistId: anime.id,
        title: anime.title,
        coverImage: anime.coverImage,
        totalEpisodes: anime.episodes ?? undefined,
        animeStatus: anime.status,
        ...data,
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

  const filteredLibraryEntries = libraryFilter === "all"
    ? libraryEntries
    : libraryEntries.filter(entry => entry.status === libraryFilter);

  const libraryAnimeCards: AnimeCard[] = filteredLibraryEntries.map((entry) => ({
    id: entry.anilistId,
    title: entry.title,
    coverImage: entry.coverImage ?? "",
    status: entry.animeStatus || "FINISHED",
    episodes: entry.totalEpisodes,
    averageScore: null,
    season: null,
    seasonYear: null,
    genres: [],
    nextAiringEpisode: null,
    streamingLinks: [],
  }));

  const displayAnimes = activeTab === "library" ? libraryAnimeCards : animes;
  const displayLoading = activeTab === "library" ? libraryLoading : loading;
  const displayError = activeTab === "library" ? libraryError : error;

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

      {activeTab === "search" && (
        <div className={styles.searchWrapper}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} loading={loading && searchQuery.length > 0} />
        </div>
      )}

      {activeTab === "library" && (
        <div className={styles.filterWrapper}>
          <div className={styles.filterPills}>
            <button
              className={`${styles.filterPill} ${libraryFilter === "all" ? styles.activeFilter : ""}`}
              onClick={() => setLibraryFilter("all")}
            >
              Todos
            </button>
            {STATUS_OPTIONS.map(([status, label]) => (
              <button
                key={status}
                className={`${styles.filterPill} ${libraryFilter === status ? styles.activeFilter : ""}`}
                onClick={() => setLibraryFilter(status)}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            className={`${styles.seasonSelect} ${styles.filterSelect}`}
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
        </div>
      )}

      <AnimeGrid
        animes={displayAnimes}
        loading={displayLoading}
        error={displayError}
        hasNextPage={activeTab !== "library" && hasNextPage}
        onLoadMore={loadMore}
        onCardClick={handleCardClick}
        onAddToLibrary={handleOpenLibraryModal}
        getLibraryEntry={(id) => findByAnilistId(id)}
        isLibraryView={activeTab === "library"}
        emptyMessage={
          activeTab === "library"
            ? "Sua biblioteca está vazia. Adicione animes para começar!"
            : activeTab === "search" && searchQuery.length < 2
            ? "Digite pelo menos 2 caracteres para buscar."
            : "Nenhum anime encontrado."
        }
      />

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
        />
      )}
    </div>
  );
}
