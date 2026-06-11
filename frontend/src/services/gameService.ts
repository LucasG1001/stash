import { api } from "./api";
import type { GameListResponse, GameDetail } from "../types/game";

export async function fetchPopular(month?: number, year?: number, page = 1): Promise<GameListResponse> {
  const params: Record<string, number> = { page };
  if (month) params.month = month;
  if (year) params.year = year;
  const response = await api.get<GameListResponse>("/api/game/popular", { params });
  return response.data;
}

export async function fetchUpcoming(page = 1): Promise<GameListResponse> {
  const response = await api.get<GameListResponse>("/api/game/upcoming", { params: { page } });
  return response.data;
}

export async function searchGames(query: string, page = 1): Promise<GameListResponse> {
  const response = await api.get<GameListResponse>("/api/game/search", { params: { q: query, page } });
  return response.data;
}

export async function fetchGameById(id: number): Promise<GameDetail> {
  const response = await api.get<GameDetail>(`/api/game/${id}`);
  return response.data;
}
