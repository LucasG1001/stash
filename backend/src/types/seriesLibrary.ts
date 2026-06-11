export type SeriesLibraryStatus = "plan_to_watch" | "watching" | "watched" | "dropped";

export interface SeriesLibraryEntry {
  id: string;
  tmdbId: number;
  title: string;
  posterImage: string | null;
  status: SeriesLibraryStatus;
  score: number;
  firstAirDate: string | null;
  seasons: number | null;
  episodes: number | null;
  seriesStatus: string;
  watchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeriesLibraryEntry {
  tmdbId: number;
  title: string;
  posterImage?: string | null;
  status?: SeriesLibraryStatus;
  score?: number;
  firstAirDate?: string | null;
  seasons?: number | null;
  episodes?: number | null;
  seriesStatus?: string;
}

export interface UpdateSeriesLibraryEntry {
  title?: string;
  posterImage?: string | null;
  status?: SeriesLibraryStatus;
  score?: number;
  firstAirDate?: string | null;
  seasons?: number | null;
  episodes?: number | null;
  seriesStatus?: string;
}

export interface SeriesLibraryRow {
  id: string;
  tmdb_id: number;
  title: string;
  poster_image: string | null;
  status: SeriesLibraryStatus;
  score: string;
  first_air_date: string | null;
  seasons: number | null;
  episodes: number | null;
  series_status: string;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
}
