import * as libraryModel from "../models/libraryModel.js";
import { fetchAnimesByIds } from "./anilistService.js";

const CACHE_TTL_HOURS = 12;

export async function refreshStaleEntries(): Promise<void> {
  const stale = await libraryModel.findStaleNonFinished(CACHE_TTL_HOURS);
  if (stale.length === 0) return;

  try {
    const animes = await fetchAnimesByIds(stale.map((entry) => entry.anilistId));
    await Promise.all(
      animes.map((anime) =>
        libraryModel.updateSyncData(anime.id, {
          totalEpisodes: anime.episodes,
          animeStatus: anime.status,
          nextAiringEpisode: anime.nextAiringEpisode,
          streamingLinks: anime.streamingLinks,
        })
      )
    );
  } catch (error) {
    console.error("Falha ao revalidar biblioteca com o AniList:", error);
  }
}
