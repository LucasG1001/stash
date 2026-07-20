import { useState, useCallback } from "react";
import { TabNav } from "../../components/TabNav/TabNav";
import { FranchiseGrid } from "../../components/FranchiseGrid/FranchiseGrid";
import { YoutubeDrawer } from "../../components/YoutubeDrawer/YoutubeDrawer";
import { YoutubeLibraryModal } from "../../components/YoutubeLibraryModal/YoutubeLibraryModal";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { ResultCount } from "../../components/ResultCount/ResultCount";
import { youtubeCardConfig } from "../../config/cards";
import { useYoutubeLibrary } from "../../hooks/useYoutubeLibrary";
import { useYoutubeCollections } from "../../hooks/useYoutubeCollections";
import type { YoutubeCard, YoutubeLibraryStatus, YoutubeOrder } from "../../types/youtubeLibrary";
import { YOUTUBE_LIBRARY_STATUS_LABELS } from "../../types/youtubeLibrary";
import { buildYoutubeCollectionGroups, type YoutubeGroup } from "../../utils/youtubeCollectionGroups";
import { youtubeLibraryEntryToCard } from "../../utils/youtubeLibraryEntryToCard";
import { filterGroupsByStatus } from "../../utils/filterGroupsByStatus";
import { formatDurationLong } from "../../utils/formatDuration";
import { formatViews } from "../../utils/formatViews";
import styles from "./YouTubePage.module.css";

const STATUS_TABS = (Object.entries(YOUTUBE_LIBRARY_STATUS_LABELS) as [YoutubeLibraryStatus, string][]).map(
  ([id, label]) => ({ id, label })
);

const ORDER_LABELS: Record<YoutubeOrder, string> = {
  added: "Recentes",
  views: "Mais vistos",
  published: "Publicação",
};

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
  const [order, setOrder] = useState<YoutubeOrder>("added");
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [drawerVideoId, setDrawerVideoId] = useState<string | null>(null);
  const [modalVideoId, setModalVideoId] = useState<string | null>(null);

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
    try {
      await addFromUrl(url);
      setUrlInput("");
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setAddError(msg ?? "Erro ao adicionar vídeo.");
    } finally {
      setAdding(false);
    }
  }, [urlInput, adding, addFromUrl]);

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

  let groups = buildYoutubeCollectionGroups(entries, order);
  if (collectionFilter === "none") {
    groups = groups.filter((g) => g.representative.collectionId == null);
  } else if (collectionFilter !== "all") {
    groups = groups.filter((g) => g.representative.collectionId === collectionFilter);
  }
  groups = filterGroupsByStatus(groups, activeStatus);
  groups = groups.filter((g) => matchesSearch(g, search));

  const gridKey = `${activeStatus}-${collectionFilter}-${order}-${search}`;

  const drawerEntry = drawerVideoId ? findByVideoId(drawerVideoId) : undefined;
  const modalEntry = modalVideoId ? findByVideoId(modalVideoId) : undefined;

  return (
    <div className={styles.page}>
      <h1 className={styles.srOnly}>YouTube</h1>

      <div className={styles.addBar}>
        <input
          className={styles.addInput}
          type="text"
          value={urlInput}
          placeholder="Cole o link do vídeo do YouTube..."
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button className={styles.addButton} onClick={handleAdd} disabled={adding || !urlInput.trim()}>
          {adding ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {addError && <div className={styles.addError}>{addError}</div>}

      <div className={styles.tabWrapper}>
        <TabNav tabs={STATUS_TABS} activeTab={activeStatus} onTabChange={(id) => setActiveStatus(id as YoutubeLibraryStatus)} />
      </div>

      <div className={styles.libraryControls}>
        <div className={styles.searchWrapper}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título ou canal..." />
        </div>
        <div className={styles.filterWrapper}>
          {collections.collections.length > 0 && (
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
          )}
          <select
            className={styles.filterSelect}
            value={order}
            onChange={(e) => setOrder(e.target.value as YoutubeOrder)}
          >
            {(Object.keys(ORDER_LABELS) as YoutubeOrder[]).map((key) => (
              <option key={key} value={key}>
                {ORDER_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        {groups.length > 0 && <ResultCount count={groups.length} />}
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
