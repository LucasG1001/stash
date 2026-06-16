import { httpRequest } from "../lib/httpClient.js";
import { fetchAnimeById } from "./anilistService.js";
import { fetchMovieById } from "./tmdbService.js";
import { fetchSeriesById } from "./tmdbSeriesService.js";
import { fetchGameById } from "./igdbService.js";
import type { LibraryEntry } from "../types/library.js";
import type { MovieLibraryEntry } from "../types/movieLibrary.js";
import type { SeriesLibraryEntry } from "../types/seriesLibrary.js";
import type { GameLibraryEntry } from "../types/gameLibrary.js";

const NOTIFY_API_URL = process.env.NOTIFY_API_URL?.replace(/\/$/, "");
const NOTIFY_API_KEY = process.env.NOTIFY_API_KEY;

interface NotifyField {
  name: string;
  value: string;
  inline?: boolean;
}

interface NotifyButton {
  text: string;
  url: string;
}

interface NotifyPayload {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  fields?: NotifyField[];
  buttons?: NotifyButton[];
}

// ---------- helpers ----------

function youtubeUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${key}`;
}

/** "2026-12-18" -> "18/12/2026" */
function formatDate(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return date;
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

function translateAnimeStatus(status: string): string {
  switch (status) {
    case "RELEASING":
      return "Em exibição";
    case "FINISHED":
      return "Finalizado";
    case "NOT_YET_RELEASED":
      return "Não lançado";
    case "CANCELLED":
      return "Cancelado";
    case "HIATUS":
      return "Em hiato";
    default:
      return status;
  }
}

function compact(fields: (NotifyField | null | undefined)[]): NotifyField[] {
  return fields.filter((f): f is NotifyField => Boolean(f && f.value));
}

async function send(type: string, payload: NotifyPayload): Promise<void> {
  if (!NOTIFY_API_URL || !NOTIFY_API_KEY) return;
  try {
    await httpRequest({
      method: "post",
      url: `${NOTIFY_API_URL}/api/notifications`,
      headers: { "x-api-key": NOTIFY_API_KEY },
      data: { type, ...payload },
    });
  } catch (error) {
    console.error("Falha ao enviar notificação:", error);
  }
}

// ---------- anime ----------

function animeUrl(anilistId: number): string {
  return `https://anilist.co/anime/${anilistId}`;
}

interface AnimePresentation {
  image?: string;
  fields: NotifyField[];
  buttons: NotifyButton[];
}

/** Busca banner, trailer e links de streaming do anime; cai para os dados da entry se falhar. */
async function animePresentation(entry: LibraryEntry): Promise<AnimePresentation> {
  const fields: NotifyField[] = [];
  const buttons: NotifyButton[] = [];
  let image = entry.coverImage ?? undefined;

  try {
    const d = await fetchAnimeById(entry.anilistId);
    image = d.bannerImage ?? d.coverImage ?? image;
    fields.push(
      { name: "Status", value: translateAnimeStatus(d.status), inline: true },
      ...(d.episodes ? [{ name: "Episódios", value: String(d.episodes), inline: true }] : []),
      ...(d.averageScore ? [{ name: "Nota", value: `${d.averageScore}/100`, inline: true }] : []),
      ...(d.genres?.length ? [{ name: "Gêneros", value: d.genres.slice(0, 4).join(", ") }] : [])
    );
    if (d.trailer && d.trailer.site.toLowerCase() === "youtube") {
      buttons.push({ text: "🎥 Trailer", url: youtubeUrl(d.trailer.id) });
    }
    for (const link of (d.streamingLinks ?? []).slice(0, 3)) {
      buttons.push({ text: `▶️ ${link.site}`, url: link.url });
    }
  } catch (error) {
    console.error("Falha ao buscar detalhes do anime:", error);
    fields.push({ name: "Status", value: translateAnimeStatus(entry.animeStatus), inline: true });
    if (entry.totalEpisodes) fields.push({ name: "Episódios", value: String(entry.totalEpisodes), inline: true });
    for (const link of (entry.streamingLinks ?? []).slice(0, 3)) {
      buttons.push({ text: `▶️ ${link.site}`, url: link.url });
    }
  }

  return { image, fields, buttons };
}

export async function notifyAnimeAdded(entry: LibraryEntry): Promise<void> {
  const url = animeUrl(entry.anilistId);
  const { image, fields, buttons } = await animePresentation(entry);
  await send("anime-adicionado", {
    title: `📥 ${entry.title}`,
    description: "Adicionado à sua biblioteca.",
    image,
    url,
    fields,
    buttons: [...buttons, { text: "🔗 AniList", url }],
  });
}

export async function notifyNewEpisode(
  entry: LibraryEntry,
  episode: number,
  totalEpisodes: number | null = entry.totalEpisodes
): Promise<void> {
  const url = animeUrl(entry.anilistId);
  const { image, fields, buttons } = await animePresentation(entry);
  await send("anime-novo-episodio", {
    title: `🆕 ${entry.title}`,
    description: `Episódio ${episode} lançado`,
    image,
    url,
    fields: [
      {
        name: "Episódio",
        value: totalEpisodes ? `${episode} / ${totalEpisodes}` : String(episode),
        inline: true,
      },
      ...fields,
    ],
    buttons: [...buttons, { text: "🔗 AniList", url }],
  });
}

export async function notifyAnimeFinished(entry: LibraryEntry, totalEpisodes: number | null): Promise<void> {
  const url = animeUrl(entry.anilistId);
  const { image, fields, buttons } = await animePresentation(entry);
  await send("anime-finalizado", {
    title: `✅ ${entry.title}`,
    description: "Anime finalizado",
    image,
    url,
    fields: [
      { name: "Total de episódios", value: totalEpisodes ? String(totalEpisodes) : "?", inline: true },
      ...fields,
    ],
    buttons: [...buttons, { text: "🔗 AniList", url }],
  });
}

// ---------- filme ----------

export async function notifyMovieAdded(entry: MovieLibraryEntry): Promise<void> {
  const url = `https://www.themoviedb.org/movie/${entry.tmdbId}`;
  let image = entry.posterImage ?? undefined;
  const fields: NotifyField[] = [];
  const buttons: NotifyButton[] = [];

  try {
    const d = await fetchMovieById(entry.tmdbId);
    image = d.backdropImage ?? d.posterImage ?? image;
    fields.push(
      ...compact([
        { name: "Lançamento", value: formatDate(d.releaseDate) ?? "", inline: true },
        d.runtime ? { name: "Duração", value: `${d.runtime} min`, inline: true } : null,
        d.voteAverage ? { name: "Nota", value: `${d.voteAverage.toFixed(1)}/10`, inline: true } : null,
        d.genres?.length ? { name: "Gêneros", value: d.genres.slice(0, 4).join(", ") } : null,
        d.watchProviders?.length
          ? { name: "Onde assistir", value: d.watchProviders.slice(0, 4).map((p) => p.name).join(", ") }
          : null,
      ])
    );
    if (d.trailerKey) buttons.push({ text: "🎥 Trailer", url: youtubeUrl(d.trailerKey) });
  } catch (error) {
    console.error("Falha ao buscar detalhes do filme:", error);
    fields.push(
      ...compact([
        { name: "Lançamento", value: formatDate(entry.releaseDate) ?? "", inline: true },
        entry.runtime ? { name: "Duração", value: `${entry.runtime} min`, inline: true } : null,
      ])
    );
  }

  await send("filme-adicionado", {
    title: `🎬 ${entry.title}`,
    description: "Adicionado à sua biblioteca.",
    image,
    url,
    fields,
    buttons: [...buttons, { text: "🔗 TMDB", url }],
  });
}

// ---------- série ----------

export async function notifySeriesAdded(entry: SeriesLibraryEntry): Promise<void> {
  const url = `https://www.themoviedb.org/tv/${entry.tmdbId}`;
  let image = entry.posterImage ?? undefined;
  const fields: NotifyField[] = [];
  const buttons: NotifyButton[] = [];

  try {
    const d = await fetchSeriesById(entry.tmdbId);
    image = d.backdropImage ?? d.posterImage ?? image;
    fields.push(
      ...compact([
        d.seasons ? { name: "Temporadas", value: String(d.seasons), inline: true } : null,
        d.episodes ? { name: "Episódios", value: String(d.episodes), inline: true } : null,
        d.voteAverage ? { name: "Nota", value: `${d.voteAverage.toFixed(1)}/10`, inline: true } : null,
        { name: "Estreia", value: formatDate(d.firstAirDate) ?? "", inline: true },
        d.genres?.length ? { name: "Gêneros", value: d.genres.slice(0, 4).join(", ") } : null,
        d.watchProviders?.length
          ? { name: "Onde assistir", value: d.watchProviders.slice(0, 4).map((p) => p.name).join(", ") }
          : null,
      ])
    );
    if (d.trailerKey) buttons.push({ text: "🎥 Trailer", url: youtubeUrl(d.trailerKey) });
  } catch (error) {
    console.error("Falha ao buscar detalhes da série:", error);
    fields.push(
      ...compact([
        entry.seasons ? { name: "Temporadas", value: String(entry.seasons), inline: true } : null,
        entry.episodes ? { name: "Episódios", value: String(entry.episodes), inline: true } : null,
        { name: "Estreia", value: formatDate(entry.firstAirDate) ?? "", inline: true },
      ])
    );
  }

  await send("serie-adicionada", {
    title: `📺 ${entry.title}`,
    description: "Adicionada à sua biblioteca.",
    image,
    url,
    fields,
    buttons: [...buttons, { text: "🔗 TMDB", url }],
  });
}

// ---------- jogo ----------

export async function notifyGameAdded(entry: GameLibraryEntry): Promise<void> {
  let image = entry.backgroundImage ?? undefined;
  let url: string | undefined;
  const fields: NotifyField[] = [];
  const buttons: NotifyButton[] = [];

  try {
    const d = await fetchGameById(entry.igdbId);
    image = d.backgroundImage ?? d.screenshots?.[0] ?? image;
    url = d.website ?? d.stores?.[0]?.url ?? undefined;
    fields.push(
      ...compact([
        { name: "Lançamento", value: formatDate(d.released) ?? "", inline: true },
        d.metacritic ? { name: "Metacritic", value: String(d.metacritic), inline: true } : null,
        d.platforms?.length ? { name: "Plataformas", value: d.platforms.slice(0, 4).join(", ") } : null,
        d.genres?.length ? { name: "Gêneros", value: d.genres.slice(0, 4).join(", ") } : null,
      ])
    );
    if (d.trailer?.youtubeId) buttons.push({ text: "🎥 Trailer", url: youtubeUrl(d.trailer.youtubeId) });
    for (const store of (d.stores ?? []).slice(0, 3)) {
      buttons.push({ text: `🛒 ${store.name}`, url: store.url });
    }
  } catch (error) {
    console.error("Falha ao buscar detalhes do jogo:", error);
    fields.push(
      ...compact([
        { name: "Lançamento", value: formatDate(entry.released) ?? "", inline: true },
        entry.metacritic ? { name: "Metacritic", value: String(entry.metacritic), inline: true } : null,
      ])
    );
  }

  await send("jogo-adicionado", {
    title: `🎮 ${entry.title}`,
    description: "Adicionado à sua biblioteca.",
    image,
    url,
    fields,
    buttons,
  });
}
