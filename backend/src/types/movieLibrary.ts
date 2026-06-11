export type MovieLibraryStatus = "plan_to_watch" | "watched" | "dropped";

export interface MovieLibraryEntry {
  id: string;
  tmdbId: number;
  title: string;
  posterImage: string | null;
  status: MovieLibraryStatus;
  score: number;
  releaseDate: string | null;
  runtime: number | null;
  movieStatus: string;
  watchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovieLibraryEntry {
  tmdbId: number;
  title: string;
  posterImage?: string | null;
  status?: MovieLibraryStatus;
  score?: number;
  releaseDate?: string | null;
  runtime?: number | null;
  movieStatus?: string;
}

export interface UpdateMovieLibraryEntry {
  title?: string;
  posterImage?: string | null;
  status?: MovieLibraryStatus;
  score?: number;
  releaseDate?: string | null;
  runtime?: number | null;
  movieStatus?: string;
}

export interface MovieLibraryRow {
  id: string;
  tmdb_id: number;
  title: string;
  poster_image: string | null;
  status: MovieLibraryStatus;
  score: string;
  release_date: string | null;
  runtime: number | null;
  movie_status: string;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
}
