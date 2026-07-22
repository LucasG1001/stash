import { useState, useEffect, useCallback, useMemo } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { MediaGrid } from "../../components/MediaGrid/MediaGrid";
import { FranchiseGrid } from "../../components/FranchiseGrid/FranchiseGrid";
import { GameDrawer } from "../../components/GameDrawer/GameDrawer";
import { GameLibraryModal } from "../../components/GameLibraryModal/GameLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { gameCardConfig } from "../../config/cards";
import { useGames } from "../../hooks/useGames";
import { useGameLibrary } from "../../hooks/useGameLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { GameCard, GameDetail } from "../../types/game";
import type { GameLibraryStatus } from "../../types/gameLibrary";
import { GAME_LIBRARY_STATUS_LABELS } from "../../types/gameLibrary";
import { MONTH_PT } from "../../utils/month";
import { getCurrentYear, getRecentYears } from "../../utils/year";
import { nextScoreSortDir, type ScoreSortDir } from "../../utils/librarySort";
import { buildGameCollectionGroups } from "../../utils/gameCollectionGroups";
import { gameLibraryEntryToCard } from "../../utils/gameLibraryEntryToCard";
import { filterGroupsByStatus } from "../../utils/filterGroupsByStatus";
import { filterGroupsBySearch } from "../../utils/filterGroupsBySearch";
import styles from "./GamesPage.module.css";

const TABS = [
  { id: "popular", label: "Mais Populares" },
  { id: "upcoming", label: "Em Breve" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(GAME_LIBRARY_STATUS_LABELS) as [GameLibraryStatus, string][];

export function GamesPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<GameLibraryStatus | "all">("all");
  const [releaseSortDir, setReleaseSortDir] = useState<"desc" | "asc">("desc");
  const [scoreSortDir, setScoreSortDir] = useState<ScoreSortDir>("off");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { games, loading, error, hasNextPage, loadPopular, loadUpcoming, search, loadMore, reset } = useGames();
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
    findByIgdbId,
  } = useGameLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "popular": loadPopular(selectedYear, selectedMonth); break;
      case "upcoming": loadUpcoming(); break;
    }
  }, [activeTab, selectedYear, selectedMonth, loadPopular, loadUpcoming]);

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

  const handleCardClick = (game: GameCard) => {
    setSelectedGameId(game.id);
  };

  const handleOpenLibraryModal = useCallback((game: GameCard) => {
    setSelectedGameForModal(game);
  }, []);

  const handleModalSave = useCallback((game: GameCard, data: { status: GameLibraryStatus; score: number; isRewatching: boolean }) => {
    const existing = findByIgdbId(game.id);
    if (existing) {
      updateEntry(existing.id, { status: data.status, score: data.score, isRewatching: data.isRewatching, gameStatus: game.gameStatus });
    } else {
      addEntry({
        igdbId: game.id,
        title: game.title,
        backgroundImage: game.backgroundImage,
        released: game.released,
        metacritic: game.metacritic,
        gameStatus: game.gameStatus,
        status: data.status,
        score: data.score,
      });
    }
    setSelectedGameForModal(null);
  }, [findByIgdbId, updateEntry, addEntry]);

  const handleModalRemove = useCallback((id: string) => {
    removeEntry(id);
    setSelectedGameForModal(null);
  }, [removeEntry]);

  const handleGameLoad = useCallback((gameDetail: GameDetail) => {
    const entry = findByIgdbId(gameDetail.id);
    if (entry) {
      const needsUpdate =
        entry.gameStatus !== gameDetail.gameStatus ||
        entry.metacritic !== gameDetail.metacritic ||
        entry.released !== gameDetail.released ||
        entry.title !== gameDetail.title ||
        entry.backgroundImage !== gameDetail.backgroundImage;

      if (needsUpdate) {
        updateEntry(entry.id, {
          title: gameDetail.title,
          backgroundImage: gameDetail.backgroundImage,
          released: gameDetail.released,
          metacritic: gameDetail.metacritic,
          gameStatus: gameDetail.gameStatus,
        });
      }
    }
  }, [findByIgdbId, updateEntry]);

  const collectionGroups = useMemo(() => filterGroupsBySearch(
    filterGroupsByStatus(
      buildGameCollectionGroups(libraryEntries, scoreSortDir, releaseSortDir),
      libraryFilter,
      (member, filter) => filter === "plan_to_play" && member.isRewatching
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
      <h1 className={styles.srOnly}>Jogos</h1>

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
            placeholder="Buscar jogo..."
          />
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
          {collectionGroups.length > 0 && (
            <span className={styles.libraryCount}>
              <span className={styles.libraryCountNum}>{collectionGroups.length}</span>
              <span className={styles.libraryCountWord}>
                {collectionGroups.length === 1 ? " resultado" : " resultados"}
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
            className={styles.filterSelect}
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value as GameLibraryStatus | "all")}
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
        </div>
      )}

      {activeTab === "library" ? (
        <FranchiseGrid
          groups={collectionGroups}
          loading={libraryLoading}
          error={libraryError}
          cardConfig={gameCardConfig}
          entryToCard={gameLibraryEntryToCard}
          getExternalId={(e) => e.igdbId}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByIgdbId(id)}
          onDeleteGroup={(group) => removeManyEntries(group.members.map((m) => m.id))}
          statusLabels={GAME_LIBRARY_STATUS_LABELS}
          onBulkSetStatus={(ids, status) => updateManyEntries(ids, status)}
          expandTitle="Ver jogos da coleção"
          animationKey={gridKey}
          emptyMessage="Sua biblioteca está vazia."
          emptyHint="Adicione jogos para começar!"
        />
      ) : (
        <MediaGrid
          items={games}
          config={gameCardConfig}
          loading={loading}
          error={error}
          hasNextPage={hasNextPage}
          onLoadMore={loadMore}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByIgdbId(id)}
          isLibraryView={false}
          animationKey={gridKey}
          emptyMessage={
            activeTab === "search" && searchQuery.length < 2
              ? "Digite pelo menos 2 caracteres para buscar."
              : "Nenhum jogo encontrado."
          }
        />
      )}

      {selectedGameId !== null && (
        <GameDrawer
          gameId={selectedGameId}
          onClose={() => setSelectedGameId(null)}
          onGameLoad={handleGameLoad}
        />
      )}

      {selectedGameForModal !== null && (
        <GameLibraryModal
          game={selectedGameForModal}
          libraryEntry={findByIgdbId(selectedGameForModal.id)}
          onClose={() => setSelectedGameForModal(null)}
          onSave={handleModalSave}
          onRemove={handleModalRemove}
          onSetCover={(id) => {
            setCoverEntry(id);
            setSelectedGameForModal(null);
          }}
        />
      )}
    </div>
  );
}
