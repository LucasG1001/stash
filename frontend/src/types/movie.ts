export interface WatchProvider {
  name: string;
  logo: string | null;
}

export interface MovieCard {
  id: number;
  title: string;
  posterImage: string;
  backdropImage: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  overview: string | null;
  movieStatus: string;
}

export interface MovieDetail extends MovieCard {
  runtime: number | null;
  genres: string[];
  tagline: string | null;
  trailerKey: string | null;
  watchProviders: WatchProvider[];
  voteCount: number | null;
}

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface MovieListResponse {
  movies: MovieCard[];
  pageInfo: PageInfo;
}
