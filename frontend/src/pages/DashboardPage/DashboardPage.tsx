import { useMemo, useState } from "react";
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
import { BookDrawer } from "../../components/BookDrawer/BookDrawer";
import { AnimeIcon, MovieIcon, SeriesIcon, BookIcon, GameIcon } from "../../components/Sidebar/Sidebar.icons";
import { buildAgenda, splitAgenda, groupByDay, groupByMonth, type AgendaItem, type AgendaGroup } from "../../utils/agenda";
import styles from "./DashboardPage.module.css";

const MEDIA_ICON: Record<AgendaItem["media"], typeof AnimeIcon> = {
  anime: AnimeIcon,
  movie: MovieIcon,
  series: SeriesIcon,
  game: GameIcon,
  book: BookIcon,
};

function itemWhen(item: AgendaItem, withDate: boolean): string {
  const d = new Date(item.when);
  const time = item.hasTime ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
  if (!withDate) return time || "—";
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return time ? `${date} ${time}` : date;
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
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const counters = [
    { label: "Anime", path: "/anime", icon: AnimeIcon, count: animes.filter((e) => e.status === "watched").length },
    { label: "Filmes", path: "/filmes", icon: MovieIcon, count: movies.filter((e) => e.status === "watched").length },
    { label: "Séries", path: "/series", icon: SeriesIcon, count: series.filter((e) => e.status === "watched").length },
    { label: "Livros", path: "/livros", icon: BookIcon, count: books.filter((e) => e.status === "read").length },
    { label: "Jogos", path: "/jogos", icon: GameIcon, count: games.filter((e) => e.status === "beaten").length },
  ];

  const agenda = useMemo(
    () => buildAgenda(animes, movies, series, games, books),
    [animes, movies, series, games, books]
  );
  const { weekGroups, laterGroups } = useMemo(() => {
    const { week, later } = splitAgenda(agenda);
    return { weekGroups: groupByDay(week), laterGroups: groupByMonth(later) };
  }, [agenda]);

  const openItem = (item: AgendaItem) => {
    if (item.media === "anime") setSelectedAnimeId(item.externalId as number);
    else if (item.media === "movie") setSelectedMovieId(item.externalId as number);
    else if (item.media === "series") setSelectedSeriesId(item.externalId as number);
    else if (item.media === "game") setSelectedGameId(item.externalId as number);
    else setSelectedBookId(item.externalId as string);
  };

  const renderGroups = (groups: AgendaGroup[], withDate: boolean) =>
    groups.map((group) => (
      <div className={styles.group} key={group.key}>
        <div className={styles.groupHeader}>{group.label}</div>
        <div className={styles.groupItems}>
          {group.items.map((item) => {
            const Icon = MEDIA_ICON[item.media];
            return (
              <button
                type="button"
                className={styles.item}
                key={`${item.media}-${item.externalId}`}
                onClick={() => openItem(item)}
              >
                <Icon className={styles.itemIcon} />
                <span className={styles.itemTime}>{itemWhen(item, withDate)}</span>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemDetail}>{item.detail}</span>
              </button>
            );
          })}
        </div>
      </div>
    ));

  return (
    <div className={styles.page}>
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
        {agenda.length === 0 ? (
          <div className={styles.empty}>Nada agendado nos próximos dias.</div>
        ) : (
          <>
            {weekGroups.length > 0 && (
              <div className={styles.block}>
                <div className={styles.blockTitle}>Esta semana</div>
                {renderGroups(weekGroups, false)}
              </div>
            )}
            {laterGroups.length > 0 && (
              <div className={styles.block}>
                <div className={styles.blockTitle}>Mais adiante</div>
                {renderGroups(laterGroups, true)}
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
      {selectedBookId !== null && (
        <BookDrawer bookId={selectedBookId} onClose={() => setSelectedBookId(null)} />
      )}
    </div>
  );
}
