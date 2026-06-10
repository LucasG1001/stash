export interface LibraryEntry {
  id: string;
  anilistId: number;
  title: string;
  coverImage: string | null;
  status: LibraryStatus;
  score: number;
  watchedEpisodes: number;
  totalEpisodes: number | null;
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
  watchedEpisodes?: number;
  totalEpisodes?: number | null;
}

export interface UpdateLibraryEntry {
  status?: LibraryStatus;
  score?: number;
  watchedEpisodes?: number;
  totalEpisodes?: number | null;
}

export interface LibraryRow {
  id: string;
  anilist_id: number;
  title: string;
  cover_image: string | null;
  status: LibraryStatus;
  score: string;
  watched_episodes: number;
  total_episodes: number | null;
  created_at: string;
  updated_at: string;
}
