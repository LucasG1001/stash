import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { GameGrid } from "../../components/GameGrid/GameGrid";
import { GameFranchiseGrid } from "../../components/GameFranchiseGrid/GameFranchiseGrid";
import { GameDrawer } from "../../components/GameDrawer/GameDrawer";
import { GameLibraryModal } from "../../components/GameLibraryModal/GameLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
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
import styles from "./GamesPage.module.css";

const TABS = [
  { id: "popular", label: "Mais Populares" },
  { id: "upcoming", label: "Em Breve" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(GAME_LIBRARY_STATUS_LABELS) as [GameLibraryStatus, string][];

export function GamesPage() {
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<GameLibraryStatus | "all">("all");
  const [releaseSortDir, setReleaseSortDir] = useState<"desc" | "asc">("desc");
  const [scoreSortDir, setScoreSortDir] = useState<ScoreSortDir>("off");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { games, loading, error, hasNextPage, loadPopular, loadUpcoming, search, loadMore } = useGames();
  const {
    entries: libraryEntries,
    loading: libraryLoading,
    error: libraryError,
    add: addEntry,
    update: updateEntry,
    remove: removeEntry,
    findByIgdbId,
  } = useGameLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "popular": loadPopular(selectedYear, selectedMonth); break;
      case "upcoming": loadUpcoming(); break;
    }
  }, [activeTab, selectedYear, selectedMonth, loadPopular, loadUpcoming]);

  useEffect(() => {
    if (activeTab === "search" && debouncedSearch.length >= 2) {
      search(debouncedSearch);
    }
  }, [debouncedSearch, activeTab, search]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery("");
  };

  const handleCardClick = (game: GameCard) => {
    setSelectedGameId(game.id);
  };

  const handleOpenLibraryModal = useCallback((game: GameCard) => {
    setSelectedGameForModal(game);
  }, []);

  const handleModalSave = useCallback((game: GameCard, data: { status: GameLibraryStatus; score: number }) => {
    const existing = findByIgdbId(game.id);
    if (existing) {
      updateEntry(existing.id, { ...data, gameStatus: game.gameStatus });
    } else {
      addEntry({
        igdbId: game.id,
        title: game.title,
        backgroundImage: game.backgroundImage,
        released: game.released,
        metacritic: game.metacritic,
        gameStatus: game.gameStatus,
        ...data,
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

  const filteredLibraryEntries = libraryFilter === "all"
    ? libraryEntries.filter(entry => entry.status !== "dropped")
    : libraryEntries.filter(entry => entry.status === libraryFilter);

  const collectionGroups = buildGameCollectionGroups(filteredLibraryEntries, scoreSortDir, releaseSortDir);

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
        <div className={styles.filterWrapper}>
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
        <GameFranchiseGrid
          groups={collectionGroups}
          loading={libraryLoading}
          error={libraryError}
          onCardClick={handleCardClick}
          onAddToLibrary={handleOpenLibraryModal}
          getLibraryEntry={(id) => findByIgdbId(id)}
          animationKey={gridKey}
          emptyMessage="Sua biblioteca está vazia."
        />
      ) : (
        <GameGrid
          games={games}
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
        />
      )}
    </div>
  );
}
