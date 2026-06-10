export type LibraryStatus = "plan_to_watch" | "watching" | "watched" | "dropped";

export interface LibraryEntry {
  id: string;
  anilistId: number;
  title: string;
  coverImage: string | null;
  status: LibraryStatus;
  score: number;
  watchedEpisodes: number;
  totalEpisodes: number | null;
  animeStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLibraryEntry {
  anilistId: number;
  title: string;
  coverImage?: string | null;
  status?: LibraryStatus;
  score?: number;
  watchedEpisodes?: number;
  totalEpisodes?: number | null;
  animeStatus?: string;
}

export interface UpdateLibraryEntry {
  title?: string;
  coverImage?: string | null;
  status?: LibraryStatus;
  score?: number;
  watchedEpisodes?: number;
  totalEpisodes?: number | null;
  animeStatus?: string;
}

export const LIBRARY_STATUS_LABELS: Record<LibraryStatus, string> = {
  plan_to_watch: "Planejo Assistir",
  watching: "Assistindo",
  watched: "Assistido",
  dropped: "Abandonado",
};
