import { useState } from "react";
import { Link } from "react-router-dom";
import { useLibrary } from "../../hooks/useLibrary";
import { useMovieLibrary } from "../../hooks/useMovieLibrary";
import { useSeriesLibrary } from "../../hooks/useSeriesLibrary";
import { useBookLibrary } from "../../hooks/useBookLibrary";
import { useGameLibrary } from "../../hooks/useGameLibrary";
import { AnimeDrawer } from "../../components/AnimeDrawer/AnimeDrawer";
import { MovieDrawer } from "../../components/MovieDrawer/MovieDrawer";
import { SeriesDrawer } from "../../components/SeriesDrawer/SeriesDrawer";
import { GameDrawer } from "../../components/GameDrawer/GameDrawer";
import { AnimeIcon, MovieIcon, SeriesIcon, BookIcon, GameIcon } from "../../components/Sidebar/Sidebar.icons";
import { buildAgenda, splitAgenda, groupByDay, groupByMonth, type AgendaItem, type AgendaGroup } from "../../utils/agenda";
import styles from "./DashboardPage.module.css";

const MEDIA_EMOJI: Record<AgendaItem["media"], string> = {
  anime: "🌸",
  movie: "🎬",
  series: "📺",
  game: "🎮",
};

function itemTime(item: AgendaItem): string {
  if (!item.hasTime) return "—";
  return new Date(item.when).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function DashboardPage() {
  const { entries: animes } = useLibrary();
  const { entries: movies } = useMovieLibrary();
  const { entries: series } = useSeriesLibrary();
  const { entries: books } = useBookLibrary();
  const { entries: games } = useGameLibrary();

  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const counters = [
    { label: "Anime", path: "/anime", icon: AnimeIcon, count: animes.length },
    { label: "Filmes", path: "/filmes", icon: MovieIcon, count: movies.length },
    { label: "Séries", path: "/series", icon: SeriesIcon, count: series.length },
    { label: "Livros", path: "/livros", icon: BookIcon, count: books.length },
    { label: "Jogos", path: "/jogos", icon: GameIcon, count: games.length },
  ];

  const agenda = buildAgenda(animes, movies, series, games);
  const { week, later } = splitAgenda(agenda);
  const weekGroups = groupByDay(week);
  const laterGroups = groupByMonth(later);

  const openItem = (item: AgendaItem) => {
    if (item.media === "anime") setSelectedAnimeId(item.externalId);
    else if (item.media === "movie") setSelectedMovieId(item.externalId);
    else if (item.media === "series") setSelectedSeriesId(item.externalId);
    else setSelectedGameId(item.externalId);
  };

  const renderGroups = (groups: AgendaGroup[]) =>
    groups.map((group) => (
      <div className={styles.group} key={group.key}>
        <div className={styles.groupHeader}>{group.label}</div>
        <div className={styles.groupItems}>
          {group.items.map((item) => (
            <button
              type="button"
              className={styles.item}
              key={`${item.media}-${item.externalId}`}
              onClick={() => openItem(item)}
            >
              <span className={styles.itemEmoji}>{MEDIA_EMOJI[item.media]}</span>
              <span className={styles.itemTime}>{itemTime(item)}</span>
              <span className={styles.itemTitle}>{item.title}</span>
              <span className={styles.itemDetail}>{item.detail}</span>
            </button>
          ))}
        </div>
      </div>
    ));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Início</h1>

      <section className={styles.counters}>
        {counters.map((c) => {
          const Icon = c.icon;
          return (
            <Link to={c.path} className={styles.counter} key={c.path}>
              <Icon className={styles.counterIcon} />
              <span className={styles.counterValue}>{c.count}</span>
              <span className={styles.counterLabel}>{c.label}</span>
            </Link>
          );
        })}
      </section>

      <section className={styles.agenda}>
        <h2 className={styles.sectionTitle}>📅 Agenda</h2>

        {agenda.length === 0 ? (
          <div className={styles.empty}>Nada agendado nos próximos dias.</div>
        ) : (
          <>
            {weekGroups.length > 0 && (
              <div className={styles.block}>
                <div className={styles.blockTitle}>Esta semana</div>
                {renderGroups(weekGroups)}
              </div>
            )}
            {laterGroups.length > 0 && (
              <div className={styles.block}>
                <div className={styles.blockTitle}>Mais adiante</div>
                {renderGroups(laterGroups)}
              </div>
            )}
          </>
        )}
      </section>

      {selectedAnimeId !== null && (
        <AnimeDrawer animeId={selectedAnimeId} onClose={() => setSelectedAnimeId(null)} />
      )}
      {selectedMovieId !== null && (
        <MovieDrawer movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
      {selectedSeriesId !== null && (
        <SeriesDrawer seriesId={selectedSeriesId} onClose={() => setSelectedSeriesId(null)} />
      )}
      {selectedGameId !== null && (
        <GameDrawer gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}
    </div>
  );
}
