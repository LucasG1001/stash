import { createLibraryModel } from "../lib/createLibraryModel.js";
import type { SeriesLibraryEntry, CreateSeriesLibraryEntry, UpdateSeriesLibraryEntry } from "../types/seriesLibrary.js";

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
  ],
  statusField: "status",
  completion: { column: "watched_at", field: "watchedAt", whenStatus: "watched" },
});
