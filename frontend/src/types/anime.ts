export interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AnimeCoverImage {
  large: string;
  extraLarge: string;
}

export interface AnimeTrailer {
  id: string;
  site: string;
}

export interface AnimeNextAiringEpisode {
  episode: number;
  airingAt: number;
}

export interface AnimeExternalLink {
  url: string;
  site: string;
  icon: string | null;
  color: string | null;
  type: string | null;
}

export interface AnimeCard {
  id: number;
  title: string;
  coverImage: string;
  status: string;
  episodes: number | null;
  averageScore: number | null;
  season: string | null;
  seasonYear: number | null;
  genres: string[];
  nextAiringEpisode: AnimeNextAiringEpisode | null;
  streamingLinks: AnimeExternalLink[];
}

export interface AnimeDetail extends AnimeCard {
  bannerImage: string | null;
  description: string | null;
  studios: string[];
  trailer: AnimeTrailer | null;
  externalLinks: AnimeExternalLink[];
  ratingCount?: number;
}

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AnimeListResponse {
  animes: AnimeCard[];
  pageInfo: PageInfo;
}
