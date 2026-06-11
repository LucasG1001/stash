import { api } from "./api";
import type { MovieListResponse, MovieDetail } from "../types/movie";

export async function fetchPopular(month?: number, year?: number, page = 1): Promise<MovieListResponse> {
  const params: Record<string, number> = { page };
  if (month) params.month = month;
  if (year) params.year = year;
  const response = await api.get<MovieListResponse>("/api/movie/popular", { params });
  return response.data;
}

export async function fetchNowPlaying(page = 1): Promise<MovieListResponse> {
  const response = await api.get<MovieListResponse>("/api/movie/now-playing", { params: { page } });
  return response.data;
}

export async function searchMovies(query: string, page = 1): Promise<MovieListResponse> {
  const response = await api.get<MovieListResponse>("/api/movie/search", { params: { q: query, page } });
  return response.data;
}

export async function fetchMovieById(id: number): Promise<MovieDetail> {
  const response = await api.get<MovieDetail>(`/api/movie/${id}`);
  return response.data;
}
