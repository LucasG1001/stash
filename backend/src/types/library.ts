import type { AniListNextAiringEpisode, AniListExternalLink } from "./anime.js";

export interface LibraryEntry {
  id: string;
  anilistId: number;
  title: string;
  coverImage: string | null;
  status: LibraryStatus;
  score: number;
  totalEpisodes: number | null;
  animeStatus: string;
  nextAiringEpisode: AniListNextAiringEpisode | null;
  streamingLinks: AniListExternalLink[];
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LibraryStatus = "plan_to_watch" | "watching" | "watched" | "dropped";

export interface CreateLibraryEntry {
  anilistId: number;
  title: string;
  coverImage?: string | null;
  status?: LibraryStatus;
  score?: number;
  totalEpisodes?: number | null;
  animeStatus?: string;
  nextAiringEpisode?: AniListNextAiringEpisode | null;
  streamingLinks?: AniListExternalLink[];
}

export interface UpdateLibraryEntry {
  title?: string;
  coverImage?: string | null;
  status?: LibraryStatus;
  score?: number;
  totalEpisodes?: number | null;
  animeStatus?: string;
}

export interface SyncLibraryData {
  totalEpisodes: number | null;
  animeStatus: string;
  nextAiringEpisode: AniListNextAiringEpisode | null;
  streamingLinks: AniListExternalLink[];
}

export interface LibraryRow {
  id: string;
  anilist_id: number;
  title: string;
  cover_image: string | null;
  status: LibraryStatus;
  score: string;
  total_episodes: number | null;
  anime_status: string;
  next_airing_episode: AniListNextAiringEpisode | null;
  streaming_links: AniListExternalLink[];
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}
