import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { AnimeGrid } from "../../components/AnimeGrid/AnimeGrid";
import { AnimeDrawer } from "../../components/AnimeDrawer/AnimeDrawer";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { useAnime } from "../../hooks/useAnime";
import { useLibrary } from "../../hooks/useLibrary";
import { useDebounce } from "../../hooks/useDebounce";
import type { AnimeCard } from "../../types/anime";
import type { AnimeDetail } from "../../types/anime";
import type { LibraryStatus } from "../../types/library";
import styles from "./AnimePage.module.css";

const TABS = [
  { id: "current", label: "Temporada Atual" },
  { id: "next", label: "Próxima Temporada" },
  { id: "popular", label: "Mais Populares" },
  { id: "search", label: "Buscar" },
  { id: "library", label: "Minha Biblioteca" },
];

export function AnimePage() {
  const [activeTab, setActiveTab] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { animes, loading, error, hasNextPage, loadCurrentSeason, loadNextSeason, loadPopular, search, loadMore } = useAnime();
  const library = useLibrary();

  useEffect(() => {
    switch (activeTab) {
      case "current": loadCurrentSeason(); break;
      case "next": loadNextSeason(); break;
      case "popular": loadPopular(); break;
    }
  }, [activeTab, loadCurrentSeason, loadNextSeason, loadPopular]);

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

  const handleAddToLibrary = useCallback((anime: AnimeCard) => {
    const existing = library.findByAnilistId(anime.id);
    if (existing) return;
    library.add({
      anilistId: anime.id,
      title: anime.title,
      coverImage: anime.coverImage,
      status: "plan_to_watch",
      totalEpisodes: anime.episodes ?? undefined,
    });
  }, [library]);

  const handleDrawerAdd = useCallback((anime: AnimeDetail, status: LibraryStatus) => {
    library.add({
      anilistId: anime.id,
      title: anime.title,
      coverImage: anime.coverImage,
      status,
      totalEpisodes: anime.episodes ?? undefined,
    });
  }, [library]);

  const handleDrawerUpdate = useCallback((id: string, data: { status?: LibraryStatus; score?: number; watchedEpisodes?: number }) => {
    library.update(id, data);
  }, [library]);

  const handleDrawerRemove = useCallback((id: string) => {
    library.remove(id);
    setSelectedAnimeId(null);
  }, [library]);

  const libraryAnimeCards: AnimeCard[] = library.entries.map((entry) => ({
    id: entry.anilistId,
    title: entry.title,
    coverImage: entry.coverImage ?? "",
    status: "FINISHED",
    episodes: entry.totalEpisodes,
    averageScore: null,
    season: null,
    seasonYear: null,
    genres: [],
    nextAiringEpisode: null,
    streamingLinks: [],
  }));

  const displayAnimes = activeTab === "library" ? libraryAnimeCards : animes;
  const displayLoading = activeTab === "library" ? library.loading : loading;
  const displayError = activeTab === "library" ? library.error : error;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Anime</h1>
      </div>

      <div className={styles.tabWrapper}>
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === "search" && (
        <div className={styles.searchWrapper}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} loading={loading && searchQuery.length > 0} />
        </div>
      )}

      <AnimeGrid
        animes={displayAnimes}
        loading={displayLoading}
        error={displayError}
        hasNextPage={activeTab !== "library" && hasNextPage}
        onLoadMore={loadMore}
        onCardClick={handleCardClick}
        onAddToLibrary={handleAddToLibrary}
        getLibraryEntry={(id) => library.findByAnilistId(id)}
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
          libraryEntry={library.findByAnilistId(selectedAnimeId)}
          onClose={() => setSelectedAnimeId(null)}
          onAdd={handleDrawerAdd}
          onUpdate={handleDrawerUpdate}
          onRemove={handleDrawerRemove}
        />
      )}
    </div>
  );
}
