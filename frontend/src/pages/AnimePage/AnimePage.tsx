import { useState, useEffect, useCallback } from "react";
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
import { nextScoreSortDir, type ScoreSortDir } from "../../utils/librarySort";
import { buildFranchiseGroups } from "../../utils/franchiseGroups";
import { libraryEntryToCard } from "../../utils/libraryEntryToCard";
import { filterGroupsByStatus } from "../../utils/filterGroupsByStatus";
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
  const [releaseSortDir, setReleaseSortDir] = useState<"desc" | "asc">("desc");
  const [scoreSortDir, setScoreSortDir] = useState<ScoreSortDir>("off");
  const [selectedSeasonObj, setSelectedSeasonObj] = useState(getCurrentRealSeason());
  const [selectedPopularYear, setSelectedPopularYear] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { animes, loading, error, hasNextPage, loadSeason, loadPopular, search, loadMore } = useAnime();
  const {
    entries: libraryEntries,
    loading: libraryLoading,
    error: libraryError,
    add: addEntry,
    update: updateEntry,
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

  const handleModalSave = useCallback((anime: AnimeCard, data: { status: LibraryStatus; score: number }) => {
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
        seasonYear: anime.seasonYear,
        nextAiringEpisode: anime.nextAiringEpisode,
        streamingLinks: anime.streamingLinks,
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

  const franchiseGroups = filterGroupsByStatus(
    buildFranchiseGroups(libraryEntries, scoreSortDir, releaseSortDir),
    libraryFilter
  );

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${releaseSortDir}-${scoreSortDir}`
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
        <div className={styles.filterWrapper}>
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
        />
      )}
    </div>
  );
}
