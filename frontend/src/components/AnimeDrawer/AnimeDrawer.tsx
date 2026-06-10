import { useState, useEffect, useCallback } from "react";
import type { AnimeDetail } from "../../types/anime";
import type { LibraryEntry, LibraryStatus } from "../../types/library";
import { LIBRARY_STATUS_LABELS } from "../../types/library";
import { fetchAnimeById } from "../../services/animeService";
import styles from "./AnimeDrawer.module.css";

interface AnimeDrawerProps {
  animeId: number;
  libraryEntry: LibraryEntry | undefined;
  onClose: () => void;
  onAdd: (anime: AnimeDetail, status: LibraryStatus) => void;
  onUpdate: (id: string, data: { status?: LibraryStatus; score?: number; watchedEpisodes?: number }) => void;
  onRemove: (id: string) => void;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "RELEASING": return "Em exibição";
    case "FINISHED": return "Finalizado";
    case "NOT_YET_RELEASED": return "Não lançado";
    default: return status;
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnimeDrawer({ animeId, libraryEntry, onClose, onAdd, onUpdate, onRemove }: AnimeDrawerProps) {
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LibraryStatus>(libraryEntry?.status ?? "plan_to_watch");
  const [score, setScore] = useState<number>(libraryEntry?.score ?? 0);
  const [watchedEpisodes, setWatchedEpisodes] = useState<number>(libraryEntry?.watchedEpisodes ?? 0);

  useEffect(() => {
    setLoading(true);
    fetchAnimeById(animeId)
      .then(setAnime)
      .finally(() => setLoading(false));
  }, [animeId]);

  useEffect(() => {
    if (libraryEntry) {
      setStatus(libraryEntry.status);
      setScore(libraryEntry.score);
      setWatchedEpisodes(libraryEntry.watchedEpisodes);
    }
  }, [libraryEntry]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleStatusChange = (newStatus: LibraryStatus) => {
    setStatus(newStatus);
    if (libraryEntry) onUpdate(libraryEntry.id, { status: newStatus });
  };

  const handleScoreChange = (newScore: number) => {
    const clamped = Math.min(10, Math.max(0, newScore));
    setScore(clamped);
    if (libraryEntry) onUpdate(libraryEntry.id, { score: clamped });
  };

  const handleEpisodesChange = (newEps: number) => {
    const clamped = Math.max(0, newEps);
    setWatchedEpisodes(clamped);
    if (libraryEntry) onUpdate(libraryEntry.id, { watchedEpisodes: clamped });
  };

  const streamingLinks = anime?.externalLinks.filter((l) => l.type === "STREAMING") ?? [];

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>

        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : anime ? (
          <>
            {anime.bannerImage ? (
              <img className={styles.banner} src={anime.bannerImage} alt="" />
            ) : (
              <div className={styles.bannerPlaceholder} />
            )}

            <div className={styles.header}>
              <img className={styles.coverImage} src={anime.coverImage} alt={anime.title} />
              <div className={styles.headerInfo}>
                <div className={styles.title}>{anime.title}</div>
                {anime.studios.length > 0 && (
                  <div className={styles.studios}>{anime.studios.join(" · ")}</div>
                )}
              </div>
            </div>

            <div className={styles.content}>
              {anime.trailer && anime.trailer.site === "youtube" && (
                <div className={styles.trailerWrapper}>
                  <iframe
                    className={styles.trailerIframe}
                    src={`https://www.youtube.com/embed/${anime.trailer.id}`}
                    title="Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {anime.description && (
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: anime.description.replace(/<br\s*\/?>/g, " ") }}
                />
              )}

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue}>{getStatusLabel(anime.status)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Episódios</span>
                  <span className={styles.infoValue}>{anime.episodes ?? "?"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nota Média</span>
                  <span className={styles.infoValue}>
                    {anime.averageScore ? `★ ${(anime.averageScore / 10).toFixed(1)}` : "N/A"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Temporada</span>
                  <span className={styles.infoValue}>
                    {anime.season && anime.seasonYear ? `${anime.season} ${anime.seasonYear}` : "N/A"}
                  </span>
                </div>
                {anime.nextAiringEpisode && (
                  <>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Próximo Episódio</span>
                      <span className={styles.infoValue}>Ep {anime.nextAiringEpisode.episode}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Data</span>
                      <span className={styles.infoValue}>{formatDate(anime.nextAiringEpisode.airingAt)}</span>
                    </div>
                  </>
                )}
              </div>

              {anime.genres.length > 0 && (
                <div>
                  <div className={styles.sectionTitle}>Gêneros</div>
                  <div className={styles.genres}>
                    {anime.genres.map((g) => (
                      <span key={g} className={styles.genreTag}>{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {streamingLinks.length > 0 && (
                <div>
                  <div className={styles.sectionTitle}>Onde assistir</div>
                  <div className={styles.streamingLinks}>
                    {streamingLinks.map((link) => (
                      <a
                        key={link.url}
                        className={styles.streamingLink}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.icon && (
                          <img className={styles.streamingLinkIcon} src={link.icon} alt="" />
                        )}
                        {link.site}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.divider} />

              <div>
                <div className={styles.sectionTitle}>Minha Biblioteca</div>
                <div className={styles.controls}>
                  <div className={styles.controlRow}>
                    <span className={styles.controlLabel}>Status</span>
                    <select
                      className={styles.controlSelect}
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value as LibraryStatus)}
                    >
                      {Object.entries(LIBRARY_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.controlRow}>
                    <span className={styles.controlLabel}>Nota</span>
                    <input
                      className={styles.controlInput}
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={score}
                      onChange={(e) => handleScoreChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.controlRow}>
                    <span className={styles.controlLabel}>Progresso</span>
                    <div className={styles.progressWrapper}>
                      <input
                        className={styles.controlInput}
                        type="number"
                        min={0}
                        value={watchedEpisodes}
                        onChange={(e) => handleEpisodesChange(parseInt(e.target.value) || 0)}
                      />
                      <span>/ {anime.episodes ?? "?"}</span>
                    </div>
                  </div>

                  <div className={styles.actionButtons}>
                    {libraryEntry ? (
                      <button className={styles.removeButton} onClick={() => onRemove(libraryEntry.id)}>
                        Remover
                      </button>
                    ) : (
                      <button
                        className={styles.addLibraryButton}
                        onClick={() => onAdd(anime, status)}
                      >
                        Adicionar à Biblioteca
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
