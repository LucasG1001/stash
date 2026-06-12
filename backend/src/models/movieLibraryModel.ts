import { createLibraryModel } from "../lib/createLibraryModel.js";
import type { MovieLibraryEntry, CreateMovieLibraryEntry, UpdateMovieLibraryEntry } from "../types/movieLibrary.js";

export const movieLibraryModel = createLibraryModel<MovieLibraryEntry, CreateMovieLibraryEntry, UpdateMovieLibraryEntry>({
  table: "movie_library",
  externalId: { column: "tmdb_id", field: "tmdbId" },
  fields: [
    { column: "title", field: "title" },
    { column: "poster_image", field: "posterImage", default: null },
    { column: "status", field: "status", default: "plan_to_watch" },
    { column: "score", field: "score", default: 0, numeric: true },
    { column: "release_date", field: "releaseDate", default: null },
    { column: "runtime", field: "runtime", default: null },
    { column: "movie_status", field: "movieStatus", default: "RELEASED" },
  ],
  statusField: "status",
  completion: { column: "watched_at", field: "watchedAt", whenStatus: "watched" },
});
