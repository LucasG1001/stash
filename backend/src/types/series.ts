export interface TmdbTvListItem {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  vote_average: number | null;
  vote_count: number | null;
  overview: string | null;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface TmdbTvDetail extends TmdbTvListItem {
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  episode_run_time: number[];
  genres: TmdbGenre[];
  tagline: string | null;
  status: string | null;
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: {
    results: Record<string, { flatrate?: TmdbProvider[] }>;
  };
}

export interface TmdbListResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbTvListItem[];
}

export interface SeriesPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface WatchProvider {
  name: string;
  logo: string | null;
}

export interface SeriesCard {
  id: number;
  title: string;
  posterImage: string;
  backdropImage: string | null;
  firstAirDate: string | null;
  voteAverage: number | null;
  overview: string | null;
  seriesStatus: string;
}

export interface SeriesDetail extends SeriesCard {
  seasons: number | null;
  episodes: number | null;
  genres: string[];
  tagline: string | null;
  airStatus: string | null;
  trailerKey: string | null;
  watchProviders: WatchProvider[];
  voteCount: number | null;
}

export interface SeriesListResult {
  series: SeriesCard[];
  pageInfo: SeriesPageInfo;
}
