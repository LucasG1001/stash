import type { AnimeNextAiringEpisode, AnimeExternalLink } from "./anime";

export type LibraryStatus = "plan_to_watch" | "watching" | "watched" | "dropped";

export interface LibraryEntry {
  id: string;
  anilistId: number;
  title: string;
  coverImage: string | null;
  status: LibraryStatus;
  score: number;
  totalEpisodes: number | null;
  animeStatus?: string;
  seasonYear: number | null;
  nextAiringEpisode: AnimeNextAiringEpisode | null;
  streamingLinks: AnimeExternalLink[];
  syncedAt: string | null;
  watchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLibraryEntry {
  anilistId: number;
  title: string;
  coverImage?: string | null;
  status?: LibraryStatus;
  score?: number;
  totalEpisodes?: number | null;
  animeStatus?: string;
  seasonYear?: number | null;
  nextAiringEpisode?: AnimeNextAiringEpisode | null;
  streamingLinks?: AnimeExternalLink[];
}

export interface UpdateLibraryEntry {
  title?: string;
  coverImage?: string | null;
  status?: LibraryStatus;
  score?: number;
  totalEpisodes?: number | null;
  animeStatus?: string;
}

export const LIBRARY_STATUS_LABELS: Record<LibraryStatus, string> = {
  plan_to_watch: "Planejo Assistir",
  watching: "Assistindo",
  watched: "Assistido",
  dropped: "Abandonado",
};
