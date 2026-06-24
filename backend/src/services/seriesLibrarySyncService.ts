import { findStaleSeries, updateSeriesSyncData } from "../models/seriesLibraryModel.js";
import { fetchSeriesSyncData, type SeriesSyncResult } from "./tmdbSeriesService.js";
import { notifySeriesNewEpisode, notifySeriesFinished, notifyError } from "./notifyService.js";
import type { SeriesLibraryEntry } from "../types/seriesLibrary.js";

const ONGOING_TTL_HOURS = 12;
const ENDED_TTL_HOURS = 24 * 7;
const FINISHED_AIR_STATUS = ["Ended", "Canceled"];

export function detectAndNotify(old: SeriesLibraryEntry, fresh: SeriesSyncResult): void {
  const pending = old.nextAiringEpisode;
  const aired = pending && pending.airingAt * 1000 <= Date.now();

  if (aired) {
    void notifySeriesNewEpisode(old, pending.episode, fresh.episodes);
  }

  const finishing =
    !fresh.nextAiringEpisode && fresh.airStatus != null && FINISHED_AIR_STATUS.includes(fresh.airStatus);
  if (finishing && old.nextAiringEpisode) {
    void notifySeriesFinished(old, fresh.episodes);
  }
}

let inFlight: Promise<void> | null = null;

export function refreshStaleSeries(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(): Promise<void> {
  const stale = await findStaleSeries(ONGOING_TTL_HOURS, ENDED_TTL_HOURS);
  if (stale.length === 0) return;

  await Promise.all(
    stale.map(async (entry) => {
      try {
        const fresh = await fetchSeriesSyncData(entry.tmdbId);
        if (entry.syncedAt) detectAndNotify(entry, fresh);
        await updateSeriesSyncData(entry.tmdbId, {
          episodes: fresh.episodes,
          nextAiringEpisode: fresh.nextAiringEpisode,
        });
      } catch (error) {
        await notifyError("seriesLibrarySyncService.refreshStaleSeries", error, { tmdbId: String(entry.tmdbId) });
      }
    })
  );
}
