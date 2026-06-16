import { httpRequest } from "../lib/httpClient.js";
import type { LibraryEntry } from "../types/library.js";

const NOTIFY_API_URL = process.env.NOTIFY_API_URL?.replace(/\/$/, "");
const NOTIFY_API_KEY = process.env.NOTIFY_API_KEY;

const COLOR_ADDED = 5763719;
const COLOR_NEW_EPISODE = 5793266;
const COLOR_FINISHED = 15418270;

interface NotifyEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface NotifyEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  thumbnail?: { url: string };
  fields?: NotifyEmbedField[];
  footer?: { text: string };
}

function animeUrl(anilistId: number): string {
  return `https://anilist.co/anime/${anilistId}`;
}

function translateStatus(status: string): string {
  switch (status) {
    case "RELEASING":
      return "Em exibição";
    case "FINISHED":
      return "Finalizado";
    case "NOT_YET_RELEASED":
      return "Não lançado";
    default:
      return status;
  }
}

function thumbnail(entry: LibraryEntry): { url: string } | undefined {
  return entry.coverImage ? { url: entry.coverImage } : undefined;
}

async function send(type: string, embed: NotifyEmbed): Promise<void> {
  if (!NOTIFY_API_URL || !NOTIFY_API_KEY) return;
  try {
    await httpRequest({
      method: "post",
      url: `${NOTIFY_API_URL}/api/notifications`,
      headers: { "x-api-key": NOTIFY_API_KEY },
      data: { type, embeds: [embed] },
    });
  } catch (error) {
    console.error("Falha ao enviar notificação:", error);
  }
}

export async function notifyAnimeAdded(entry: LibraryEntry): Promise<void> {
  await send("anime-adicionado", {
    title: `📥 ${entry.title}`,
    url: animeUrl(entry.anilistId),
    description: "Adicionado à sua biblioteca.",
    color: COLOR_ADDED,
    thumbnail: thumbnail(entry),
    fields: [
      { name: "Status", value: translateStatus(entry.animeStatus), inline: true },
      { name: "Episódios", value: entry.totalEpisodes ? String(entry.totalEpisodes) : "?", inline: true },
    ],
    footer: { text: "Media Tracker" },
  });
}

export async function notifyNewEpisode(
  entry: LibraryEntry,
  episode: number,
  totalEpisodes: number | null = entry.totalEpisodes
): Promise<void> {
  await send("anime-novo-episodio", {
    title: `🆕 ${entry.title}`,
    url: animeUrl(entry.anilistId),
    description: `Episódio **${episode}** disponível!`,
    color: COLOR_NEW_EPISODE,
    thumbnail: thumbnail(entry),
    fields: [
      {
        name: "Episódio",
        value: totalEpisodes ? `${episode} / ${totalEpisodes}` : String(episode),
        inline: true,
      },
    ],
    footer: { text: "Media Tracker" },
  });
}

export async function notifyAnimeFinished(entry: LibraryEntry, totalEpisodes: number | null): Promise<void> {
  await send("anime-finalizado", {
    title: `✅ ${entry.title}`,
    url: animeUrl(entry.anilistId),
    description: "Terminou de lançar! 🎉",
    color: COLOR_FINISHED,
    thumbnail: thumbnail(entry),
    fields: [{ name: "Total de episódios", value: totalEpisodes ? String(totalEpisodes) : "?", inline: true }],
    footer: { text: "Media Tracker" },
  });
}
