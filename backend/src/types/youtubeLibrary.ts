export type YoutubeLibraryStatus = "plan_to_watch" | "liked" | "removed";

export interface YoutubeLibraryEntry {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string | null;
  thumbnail: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  publishedAt: string | null;
  description: string | null;
  status: YoutubeLibraryStatus;
  score: number;
  likedAt: string | null;
  isRewatching: boolean;
  collectionId: number | null;
  isCover: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateYoutubeLibraryEntry {
  videoId: string;
  title: string;
  channelTitle?: string | null;
  thumbnail?: string | null;
  durationSeconds?: number | null;
  viewCount?: number | null;
  publishedAt?: string | null;
  description?: string | null;
  status?: YoutubeLibraryStatus;
  score?: number;
}

export interface UpdateYoutubeLibraryEntry {
  title?: string;
  channelTitle?: string | null;
  thumbnail?: string | null;
  durationSeconds?: number | null;
  viewCount?: number | null;
  publishedAt?: string | null;
  description?: string | null;
  status?: YoutubeLibraryStatus;
  score?: number;
  isRewatching?: boolean;
}

export interface YoutubeCollection {
  id: number;
  name: string;
}
