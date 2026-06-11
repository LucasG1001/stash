import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { GameGrid } from "../../components/GameGrid/GameGrid";
import { GameDrawer } from "../../components/GameDrawer/GameDrawer";
import { GameLibraryModal } from "../../components/GameLibraryModal/GameLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { useGames } from "../../hooks/useGames";
import { useGameLibrary } from "../../hooks/useGameLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { GameCard, GameDetail } from "../../types/game";
import type { GameLibraryStatus } from "../../types/gameLibrary";
import { GAME_LIBRARY_STATUS_LABELS } from "../../types/gameLibrary";
import { MONTH_PT, getCurrentMonth, getLast12Months } from "../../utils/month";
import styles from "./GamesPage.module.css";

const TABS = [
  { id: "popular", label: "Mais Populares" },
  { id: "upcoming", label: "Em Breve" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

const STATUS_OPTIONS = Object.entries(GAME_LIBRARY_STATUS_LABELS) as [GameLibraryStatus, string][];

export function GamesPage() {
  const [activeTab, setActiveTab] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameCard | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<GameLibraryStatus | "all">("all");
  const [finishedSortDir, setFinishedSortDir] = useState<"desc" | "asc">("desc");
  const [selectedMonthObj, setSelectedMonthObj] = useState(getCurrentMonth());
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { games, loading, error, hasNextPage, loadPopular, loadUpcoming, search, loadMore } = useGames();
  const {
    entries: libraryEntries,
    loading: libraryLoading,
    error: libraryError,
    add: addEntry,
    update: updateEntry,
    remove: removeEntry,
    findByRawgId,
  } = useGameLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "popular": loadPopular(selectedMonthObj.month, selectedMonthObj.year); break;
      case "upcoming": loadUpcoming(); break;
    }
  }, [activeTab, selectedMonthObj, loadPopular, loadUpcoming]);

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
    const existing = findByRawgId(game.id);
    if (existing) {
      updateEntry(existing.id, { ...data, gameStatus: game.gameStatus });
    } else {
      addEntry({
        rawgId: game.id,
        title: game.title,
        backgroundImage: game.backgroundImage,
        released: game.released,
        metacritic: game.metacritic,
        gameStatus: game.gameStatus,
        ...data,
      });
    }
    setSelectedGameForModal(null);
  }, [findByRawgId, updateEntry, addEntry]);

  const handleModalRemove = useCallback((id: string) => {
    removeEntry(id);
    setSelectedGameForModal(null);
  }, [removeEntry]);

  const handleGameLoad = useCallback((gameDetail: GameDetail) => {
    const entry = findByRawgId(gameDetail.id);
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
  }, [findByRawgId, updateEntry]);

  const filteredLibraryEntries = libraryFilter === "all"
    ? libraryEntries
    : libraryEntries.filter(entry => entry.status === libraryFilter);

  const showFinishedSort = libraryFilter === "beaten";

  const sortedLibraryEntries = showFinishedSort
    ? [...filteredLibraryEntries].sort((a, b) => {
        const ta = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
        const tb = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
        const diff = ta - tb;
        return finishedSortDir === "desc" ? -diff : diff;
      })
    : filteredLibraryEntries;

  const libraryGameCards: GameCard[] = sortedLibraryEntries.map((entry) => ({
    id: entry.rawgId,
    title: entry.title,
    backgroundImage: entry.backgroundImage,
    released: entry.released,
    rating: null,
    metacritic: entry.metacritic,
    gameStatus: entry.gameStatus || "RELEASED",
  }));

  const displayGames = activeTab === "library" ? libraryGameCards : games;
  const displayLoading = activeTab === "library" ? libraryLoading : loading;
  const displayError = activeTab === "library" ? libraryError : error;

  const gridKey =
    activeTab === "library"
      ? `library-${libraryFilter}-${finishedSortDir}`
      : activeTab === "search"
      ? `search-${debouncedSearch}`
      : activeTab === "popular"
      ? `popular-${selectedMonthObj.month}-${selectedMonthObj.year}`
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
          {showFinishedSort && (
            <button
              className={styles.sortButton}
              onClick={() => setFinishedSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
              title={finishedSortDir === "desc" ? "Mais recentes primeiro" : "Mais antigas primeiro"}
            >
              <span>Data de conclusão</span>
              <span className={`${styles.sortIcon} ${finishedSortDir === "asc" ? styles.sortIconAsc : ""}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </span>
            </button>
          )}
        </div>
      )}

      <GameGrid
        games={displayGames}
        loading={displayLoading}
        error={displayError}
        hasNextPage={activeTab !== "library" && hasNextPage}
        onLoadMore={loadMore}
        onCardClick={handleCardClick}
        onAddToLibrary={handleOpenLibraryModal}
        getLibraryEntry={(id) => findByRawgId(id)}
        isLibraryView={activeTab === "library"}
        animationKey={gridKey}
        emptyMessage={
          activeTab === "library"
            ? "Sua biblioteca está vazia. Adicione jogos para começar!"
            : activeTab === "search" && searchQuery.length < 2
            ? "Digite pelo menos 2 caracteres para buscar."
            : "Nenhum jogo encontrado."
        }
      />

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
          libraryEntry={findByRawgId(selectedGameForModal.id)}
          onClose={() => setSelectedGameForModal(null)}
          onSave={handleModalSave}
          onRemove={handleModalRemove}
        />
      )}
    </div>
  );
}
