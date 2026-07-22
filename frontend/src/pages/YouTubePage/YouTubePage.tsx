import { useState, useEffect, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { FranchiseGrid } from "../../components/FranchiseGrid/FranchiseGrid";
import { YoutubeDrawer } from "../../components/YoutubeDrawer/YoutubeDrawer";
import { YoutubeLibraryModal } from "../../components/YoutubeLibraryModal/YoutubeLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { youtubeCardConfig } from "../../config/cards";
import { useYoutubeLibrary } from "../../hooks/useYoutubeLibrary";
import { useYoutubeCollections } from "../../hooks/useYoutubeCollections";
import type { YoutubeCard, YoutubeLibraryStatus } from "../../types/youtubeLibrary";
import { YOUTUBE_LIBRARY_STATUS_LABELS } from "../../types/youtubeLibrary";
import { buildYoutubeCollectionGroups, applyStatusView, type YoutubeGroup } from "../../utils/youtubeCollectionGroups";
import { youtubeLibraryEntryToCard } from "../../utils/youtubeLibraryEntryToCard";
import { formatDurationLong } from "../../utils/formatDuration";
import { formatViews } from "../../utils/formatViews";
import styles from "./YouTubePage.module.css";

const STATUS_TABS = (Object.entries(YOUTUBE_LIBRARY_STATUS_LABELS) as [YoutubeLibraryStatus, string][]).map(
  ([id, label]) => ({ id, label })
);

function matchesSearch(group: YoutubeGroup, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return group.members.some(
    (m) => m.title.toLowerCase().includes(q) || (m.channelTitle ?? "").toLowerCase().includes(q)
  );
}

export function YouTubePage() {
  const [activeStatus, setActiveStatus] = useState<YoutubeLibraryStatus>("liked");
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<number | "all" | "none">("all");
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [drawerVideoId, setDrawerVideoId] = useState<string | null>(null);
  const [modalVideoId, setModalVideoId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const {
    entries,
    loading,
    error,
    update: updateEntry,
    updateMany: updateManyEntries,
    setCover: setCoverEntry,
    remove: removeEntry,
    removeMany: removeManyEntries,
    findByVideoId,
    addFromUrl,
    formGroup,
    addToGroup,
    removeFromGroup,
  } = useYoutubeLibrary();

  const collections = useYoutubeCollections();

  const handleAdd = useCallback(async () => {
    const url = urlInput.trim();
    if (!url || adding) return;
    setAdding(true);
    setAddError(null);
    setAddNotice(null);
    try {
      const result = await addFromUrl(url);
      setUrlInput("");
      if (result && "playlist" in result) {
        setAddNotice(`Playlist "${result.playlist.name}" adicionada — ${result.playlist.imported} vídeos`);
        collections.reload();
      }
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setAddError(msg ?? "Erro ao adicionar vídeo.");
    } finally {
      setAdding(false);
    }
  }, [urlInput, adding, addFromUrl, collections]);

  const handleCardClick = useCallback((card: YoutubeCard) => {
    setDrawerVideoId(card.id);
  }, []);

  const handleOpenModal = useCallback((card: YoutubeCard) => {
    setModalVideoId(card.id);
  }, []);

  const handleModalSave = useCallback(
    (id: string, data: { status: YoutubeLibraryStatus; score: number; isRewatching: boolean }) => {
      updateEntry(id, data);
      setModalVideoId(null);
    },
    [updateEntry]
  );

  const handleModalRemove = useCallback(
    (id: string) => {
      removeEntry(id).then(() => collections.reload());
      setModalVideoId(null);
    },
    [removeEntry, collections]
  );

  let groups = buildYoutubeCollectionGroups(entries);
  if (collectionFilter === "none") {
    groups = groups.filter((g) => g.representative.collectionId == null);
  } else if (collectionFilter !== "all") {
    groups = groups.filter((g) => g.representative.collectionId === collectionFilter);
  }
  groups = applyStatusView(groups, activeStatus);
  groups = groups.filter((g) => matchesSearch(g, search));
  // Coleções em ordem alfabética (por nome); avulsos mantêm a ordem (depois das coleções).
  groups = [...groups].sort((a, b) => {
    const aColl = a.representative.collectionId;
    const bColl = b.representative.collectionId;
    if ((aColl != null) !== (bColl != null)) return aColl != null ? -1 : 1;
    if (aColl != null && bColl != null) {
      const an = (collections.byId.get(aColl) ?? "").toLowerCase();
      const bn = (collections.byId.get(bColl) ?? "").toLowerCase();
      return an.localeCompare(bn, "pt");
    }
    return 0;
  });

  const gridKey = `${activeStatus}-${collectionFilter}-${search}`;

  const drawerEntry = drawerVideoId ? findByVideoId(drawerVideoId) : undefined;
  const modalEntry = modalVideoId ? findByVideoId(modalVideoId) : undefined;

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>YouTube</h1>

      <div className={styles.topRow}>
        <div className={styles.tabWrapper}>
          <TabNav plain tabs={STATUS_TABS} activeTab={activeStatus} onTabChange={(id) => setActiveStatus(id as YoutubeLibraryStatus)} />
        </div>
        <div className={styles.addBar}>
          <input
            className={styles.addInput}
            type="text"
            value={urlInput}
            placeholder="Cole o link de um vídeo ou playlist do YouTube..."
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <button className={styles.addButton} onClick={handleAdd} disabled={adding || !urlInput.trim()}>
            {adding ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
      {addError && <div className={styles.addError}>{addError}</div>}
      {addNotice && <div className={styles.addNotice}>{addNotice}</div>}

      <div className={styles.libraryControls}>
        <div className={styles.searchWrapper}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título ou canal..." />
        </div>
        {collections.collections.length > 0 && (
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
        )}
        {groups.length > 0 && (
          <span className={styles.libraryCount}>
            <span className={styles.libraryCountNum}>{groups.length}</span>
            <span className={styles.libraryCountWord}>
              {groups.length === 1 ? " resultado" : " resultados"}
            </span>
          </span>
        )}
        {collections.collections.length > 0 && (
          <>
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
                value={collectionFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setCollectionFilter(v === "all" || v === "none" ? v : Number(v));
                }}
              >
                <option value="all">Todas as coleções</option>
                <option value="none">Sem coleção</option>
                {collections.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <FranchiseGrid
        groups={groups}
        loading={loading}
        error={error}
        cardConfig={youtubeCardConfig}
        entryToCard={youtubeLibraryEntryToCard}
        getExternalId={(e) => e.videoId}
        getLibraryEntry={(id) => findByVideoId(id)}
        onCardClick={handleCardClick}
        onAddToLibrary={handleOpenModal}
        onDeleteGroup={(group) => removeManyEntries(group.members.map((m) => m.id)).then(() => collections.reload())}
        statusLabels={YOUTUBE_LIBRARY_STATUS_LABELS}
        onBulkSetStatus={(ids, status) => updateManyEntries(ids, status)}
        expandTitle="Ver vídeos da coleção"
        animationKey={gridKey}
        gridClassName={styles.youtubeGrid}
        expansionClassName={styles.youtubeExpansion}
        emptyMessage="Nada por aqui ainda."
        emptyHint="Cole o link de um vídeo do YouTube para começar!"
        getCollectionKey={(e) => e.collectionId}
        onFormGroup={(ids, name) => formGroup(ids, name).then(() => collections.reload())}
        onAddToGroup={(ids, collectionId) => addToGroup(ids, collectionId).then(() => collections.reload())}
        onRemoveFromGroup={(ids) => removeFromGroup(ids).then(() => collections.reload())}
        getCollectionName={(group) =>
          group.representative.collectionId != null
            ? collections.byId.get(group.representative.collectionId) ?? null
            : null
        }
        onRenameCollection={(group, name) => {
          if (group.representative.collectionId != null) collections.rename(group.representative.collectionId, name);
        }}
        getCollectionExtra={(group) => {
          const totalDuration = group.members.reduce((sum, v) => sum + (v.durationSeconds ?? 0), 0);
          const totalViews = group.members.reduce((sum, v) => sum + (v.viewCount ?? 0), 0);
          return (
            <div className={styles.collMeta}>
              {formatDurationLong(totalDuration)} · {formatViews(totalViews)}
            </div>
          );
        }}
      />

      {drawerEntry && <YoutubeDrawer entry={drawerEntry} onClose={() => setDrawerVideoId(null)} />}

      {modalEntry && (
        <YoutubeLibraryModal
          entry={modalEntry}
          onClose={() => setModalVideoId(null)}
          onSave={handleModalSave}
          onRemove={handleModalRemove}
          onSetCover={(id) => {
            setCoverEntry(id);
            setModalVideoId(null);
          }}
        />
      )}
    </div>
  );
}
