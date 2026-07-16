import { pool } from "../database/connection.js";
import { createLibraryModel } from "../lib/createLibraryModel.js";
import type {
  SeriesLibraryEntry,
  CreateSeriesLibraryEntry,
  UpdateSeriesLibraryEntry,
  SeriesLibraryRow,
  SeriesNextAiringEpisode,
} from "../types/seriesLibrary.js";

export const seriesLibraryModel = createLibraryModel<SeriesLibraryEntry, CreateSeriesLibraryEntry, UpdateSeriesLibraryEntry>({
  table: "series_library",
  externalId: { column: "tmdb_id", field: "tmdbId" },
  fields: [
    { column: "title", field: "title" },
    { column: "poster_image", field: "posterImage", default: null },
    { column: "status", field: "status", default: "plan_to_watch" },
    { column: "score", field: "score", default: 0, numeric: true },
    { column: "first_air_date", field: "firstAirDate", default: null },
    { column: "seasons", field: "seasons", default: null },
    { column: "episodes", field: "episodes", default: null },
    { column: "series_status", field: "seriesStatus", default: "RELEASED" },
    { column: "next_airing_episode", field: "nextAiringEpisode", default: null, readonly: true },
    { column: "synced_at", field: "syncedAt", default: null, readonly: true },
    { column: "last_notified_episode", field: "lastNotifiedEpisode", default: null, readonly: true },
  ],
  statusField: "status",
  completion: { column: "watched_at", field: "watchedAt", whenStatus: "watched" },
  rewatch: { column: "is_rewatching", field: "isRewatching" },
});

function toSeriesEntry(row: SeriesLibraryRow): SeriesLibraryEntry {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    title: row.title,
    posterImage: row.poster_image,
    status: row.status,
    score: parseFloat(row.score),
    firstAirDate: row.first_air_date,
    seasons: row.seasons,
    episodes: row.episodes,
    seriesStatus: row.series_status,
    nextAiringEpisode: row.next_airing_episode,
    syncedAt: row.synced_at,
    lastNotifiedEpisode: row.last_notified_episode,
    isRewatching: row.is_rewatching,
    watchedAt: row.watched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findStaleSeries(
  ongoingTtlHours: number,
  endedTtlHours: number
): Promise<SeriesLibraryEntry[]> {
  const result = await pool.query<SeriesLibraryRow>(
    `SELECT * FROM series_library
     WHERE status != 'dropped'
       AND (
         synced_at IS NULL
         OR (next_airing_episode IS NOT NULL AND synced_at < NOW() - ($1 || ' hours')::interval)
         OR (next_airing_episode IS NULL AND synced_at < NOW() - ($2 || ' hours')::interval)
       )`,
    [ongoingTtlHours, endedTtlHours]
  );
  return result.rows.map(toSeriesEntry);
}

export async function findDueSeriesEpisodes(): Promise<SeriesLibraryEntry[]> {
  const result = await pool.query<SeriesLibraryRow>(
    `SELECT * FROM series_library
     WHERE status != 'dropped'
       AND next_airing_episode IS NOT NULL
       AND (next_airing_episode->>'airingAt')::bigint <= EXTRACT(EPOCH FROM NOW())
       AND (next_airing_episode->>'episode')::int > COALESCE(last_notified_episode, 0)`
  );
  return result.rows.map(toSeriesEntry);
}

export async function markSeriesEpisodeNotified(tmdbId: number, episode: number): Promise<void> {
  await pool.query(
    `UPDATE series_library SET last_notified_episode = $2 WHERE tmdb_id = $1`,
    [tmdbId, episode]
  );
}

export interface SeriesSyncData {
  episodes: number | null;
  nextAiringEpisode: SeriesNextAiringEpisode | null;
}

export async function updateSeriesSyncData(tmdbId: number, data: SeriesSyncData): Promise<void> {
  await pool.query(
    `UPDATE series_library
     SET episodes = $2,
         next_airing_episode = $3,
         synced_at = NOW()
     WHERE tmdb_id = $1`,
    [tmdbId, data.episodes, JSON.stringify(data.nextAiringEpisode ?? null)]
  );
}
