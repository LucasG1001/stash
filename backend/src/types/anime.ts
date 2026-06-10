export interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AniListCoverImage {
  large: string;
  extraLarge: string;
}

export interface AniListTrailer {
  id: string;
  site: string;
}

export interface AniListStudio {
  name: string;
}

export interface AniListNextAiringEpisode {
  episode: number;
  airingAt: number;
}

export interface AniListExternalLink {
  url: string;
  site: string;
  icon: string | null;
  color: string | null;
  type: string | null;
}

export interface AniListAnime {
  id: number;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  description: string | null;
  status: string;
  episodes: number | null;
  genres: string[];
  studios: { nodes: AniListStudio[] };
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  trailer: AniListTrailer | null;
  nextAiringEpisode: AniListNextAiringEpisode | null;
  externalLinks: AniListExternalLink[];
}

export interface AniListPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AniListPage {
  pageInfo: AniListPageInfo;
  media: AniListAnime[];
}

export interface AniListResponse {
  data: {
    Page: AniListPage;
  };
}

export interface AniListSingleResponse {
  data: {
    Media: AniListAnime;
  };
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
  nextAiringEpisode: AniListNextAiringEpisode | null;
  streamingLinks: AniListExternalLink[];
}

export interface AnimeDetail extends AnimeCard {
  bannerImage: string | null;
  description: string | null;
  studios: string[];
  trailer: AniListTrailer | null;
  externalLinks: AniListExternalLink[];
}
