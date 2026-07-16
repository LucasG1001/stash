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
  isRewatching: boolean;
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
  isRewatching?: boolean;
}

export const SERIES_LIBRARY_STATUS_LABELS: Record<SeriesLibraryStatus, string> = {
  plan_to_watch: "Planejo Assistir",
  watching: "Assistindo",
  watched: "Assistido",
  dropped: "Abandonado",
};
