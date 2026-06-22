import { useState, useEffect, useCallback } from "react";
import type { SeriesDetail } from "../../types/series";
import { fetchSeriesById } from "../../services/seriesService";
import { TrailerEmbed } from "../TrailerEmbed/TrailerEmbed";
import styles from "./SeriesDrawer.module.css";

interface SeriesDrawerProps {
  seriesId: number;
  onClose: () => void;
  onSeriesLoad?: (series: SeriesDetail) => void;
}

function getAirStatusLabel(status: string | null): string {
  switch (status) {
    case "Returning Series": return "Em exibição";
    case "Ended": return "Finalizada";
    case "Canceled": return "Cancelada";
    case "In Production": return "Em produção";
    case "Planned": return "Planejada";
    default: return status ?? "N/A";
  }
}

function formatAirDate(date: string | null): string {
  if (!date) return "N/A";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SeriesDrawer({ seriesId, onClose, onSeriesLoad }: SeriesDrawerProps) {
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSeriesById(seriesId)
      .then((data) => {
        if (!active) return;
        setSeries(data);
        onSeriesLoad?.(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

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

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>

        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : series ? (
          <>
            {series.backdropImage ? (
              <img className={styles.banner} src={series.backdropImage} alt="" />
            ) : (
              <div className={styles.bannerPlaceholder} />
            )}

            <div className={styles.header}>
              {series.posterImage ? (
                <img className={styles.coverImage} src={series.posterImage} alt={series.title} />
              ) : (
                <div className={styles.coverPlaceholder}>📺</div>
              )}
              <div className={styles.headerInfo}>
                <div className={styles.title}>{series.title}</div>
                {series.tagline && <div className={styles.tagline}>{series.tagline}</div>}
              </div>
            </div>

            <div className={styles.content}>
              {series.trailerKey && (
                <TrailerEmbed youtubeId={series.trailerKey} />
              )}

              {series.overview && <div className={styles.description}>{series.overview}</div>}

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue}>{getAirStatusLabel(series.airStatus)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Estreia</span>
                  <span className={styles.infoValue}>{formatAirDate(series.firstAirDate)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Temporadas</span>
                  <span className={styles.infoValue}>{series.seasons ?? "?"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Episódios</span>
                  <span className={styles.infoValue}>{series.episodes ?? "?"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nota Média</span>
                  <span className={styles.infoValue}>
                    {series.voteAverage
                      ? `★ ${series.voteAverage.toFixed(1)}${series.voteCount ? ` (${series.voteCount.toLocaleString("pt-BR")})` : ""}`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {series.genres.length > 0 && (
                <div>
                  <div className={styles.sectionTitle}>Gêneros</div>
                  <div className={styles.genres}>
                    {series.genres.map((g) => (
                      <span key={g} className={styles.genreTag}>{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {series.watchProviders.length > 0 && (
                <div>
                  <div className={styles.sectionTitle}>Onde assistir</div>
                  <div className={styles.providers}>
                    {series.watchProviders.map((p) => (
                      <div key={p.name} className={styles.provider}>
                        {p.logo && <img className={styles.providerLogo} src={p.logo} alt="" />}
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
