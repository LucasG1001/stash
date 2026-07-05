export type SeriesLibraryStatus = "plan_to_watch" | "watching" | "watched" | "dropped";

export interface SeriesNextAiringEpisode {
  episode: number;
  airingAt: number;
}

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
  nextAiringEpisode: SeriesNextAiringEpisode | null;
  syncedAt: string | null;
  lastNotifiedEpisode: number | null;
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
  next_airing_episode: SeriesNextAiringEpisode | null;
  synced_at: string | null;
  last_notified_episode: number | null;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
}
