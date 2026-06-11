import * as libraryModel from "../models/libraryModel.js";
import { fetchAnimesByIds } from "./anilistService.js";

const NON_FINISHED_TTL_HOURS = 12;
const FINISHED_TTL_HOURS = 24 * 7;

export async function refreshStaleEntries(): Promise<void> {
  const stale = await libraryModel.findStale(NON_FINISHED_TTL_HOURS, FINISHED_TTL_HOURS);
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
