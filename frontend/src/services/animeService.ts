import { api } from "./api";
import type { AnimeListResponse, AnimeDetail } from "../types/anime";

export async function fetchSeason(season?: string, year?: number, page = 1): Promise<AnimeListResponse> {
  const params: Record<string, any> = { page };
  if (season) params.season = season;
  if (year) params.year = year;
  const response = await api.get<AnimeListResponse>("/api/anime/season", { params });
  return response.data;
}

export async function fetchPopular(page = 1): Promise<AnimeListResponse> {
  const response = await api.get<AnimeListResponse>("/api/anime/popular", { params: { page } });
  return response.data;
}

export async function searchAnimes(query: string, page = 1): Promise<AnimeListResponse> {
  const response = await api.get<AnimeListResponse>("/api/anime/search", { params: { q: query, page } });
  return response.data;
}

export async function fetchAnimeById(id: number): Promise<AnimeDetail> {
  const response = await api.get<AnimeDetail>(`/api/anime/${id}`);
  return response.data;
}
