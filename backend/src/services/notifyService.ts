import { httpRequest } from "../lib/httpClient.js";
import { fetchAnimeById } from "./anilistService.js";
import type { LibraryEntry } from "../types/library.js";
import type { SeriesLibraryEntry } from "../types/seriesLibrary.js";

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

// ---------- séries ----------

function seriesUrl(tmdbId: number): string {
  return `https://www.themoviedb.org/tv/${tmdbId}`;
}

export async function notifySeriesNewEpisode(
  entry: SeriesLibraryEntry,
  episode: number,
  totalEpisodes: number | null = entry.episodes
): Promise<void> {
  const url = seriesUrl(entry.tmdbId);
  await send("serie-novo-episodio", {
    title: `🆕 ${entry.title}`,
    description: `Episódio ${episode} lançado`,
    image: entry.posterImage ?? undefined,
    url,
    fields: [
      {
        name: "Episódio",
        value: totalEpisodes ? `${episode} / ${totalEpisodes}` : String(episode),
        inline: true,
      },
    ],
    buttons: [{ text: "🔗 TMDB", url }],
  });
}

export async function notifySeriesFinished(entry: SeriesLibraryEntry, totalEpisodes: number | null): Promise<void> {
  const url = seriesUrl(entry.tmdbId);
  await send("serie-finalizada", {
    title: `✅ ${entry.title}`,
    description: "Série finalizada",
    image: entry.posterImage ?? undefined,
    url,
    fields: [{ name: "Total de episódios", value: totalEpisodes ? String(totalEpisodes) : "?", inline: true }],
    buttons: [{ text: "🔗 TMDB", url }],
  });
}
