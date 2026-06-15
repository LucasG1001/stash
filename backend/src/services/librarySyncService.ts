import * as libraryModel from "../models/libraryModel.js";
import { fetchAnimesByIds } from "./anilistService.js";
import { notifyNewEpisode, notifyAnimeFinished } from "./notifyService.js";
import type { AniListNextAiringEpisode } from "../types/anime.js";
import type { LibraryEntry } from "../types/library.js";
import type { AnimeCard } from "../types/anime.js";

const NON_FINISHED_TTL_HOURS = 12;
const FINISHED_TTL_HOURS = 24 * 7;

export function lastAiredEpisode(
  animeStatus: string,
  nextAiringEpisode: AniListNextAiringEpisode | null,
  totalEpisodes: number | null
): number {
  if (nextAiringEpisode) return nextAiringEpisode.episode - 1;
  if (animeStatus === "FINISHED") return totalEpisodes ?? 0;
  return 0;
}

function detectAndNotify(old: LibraryEntry, anime: AnimeCard): void {
  const oldLast = lastAiredEpisode(old.animeStatus, old.nextAiringEpisode, old.totalEpisodes);
  const newLast = lastAiredEpisode(anime.status, anime.nextAiringEpisode, anime.episodes);

  if (newLast > oldLast) {
    void notifyNewEpisode(old, newLast);
  }

  if (old.animeStatus !== "FINISHED" && anime.status === "FINISHED") {
    void notifyAnimeFinished(old, anime.episodes);
  }
}

export async function refreshStaleEntries(): Promise<void> {
  const stale = await libraryModel.findStale(NON_FINISHED_TTL_HOURS, FINISHED_TTL_HOURS);
  if (stale.length === 0) return;

  try {
    const byId = new Map(stale.map((entry) => [entry.anilistId, entry]));
    const animes = await fetchAnimesByIds(stale.map((entry) => entry.anilistId));
    await Promise.all(
      animes.map((anime) => {
        const old = byId.get(anime.id);
        if (old && old.syncedAt && old.status !== "dropped") {
          detectAndNotify(old, anime);
        }
        return libraryModel.updateSyncData(anime.id, {
          totalEpisodes: anime.episodes,
          animeStatus: anime.status,
          nextAiringEpisode: anime.nextAiringEpisode,
          streamingLinks: anime.streamingLinks,
        });
      })
    );
  } catch (error) {
    console.error("Falha ao revalidar biblioteca com o AniList:", error);
  }
}
