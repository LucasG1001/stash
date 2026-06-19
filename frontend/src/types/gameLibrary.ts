export type GameLibraryStatus = "plan_to_play" | "playing" | "beaten" | "dropped";

export interface GameLibraryEntry {
  id: string;
  igdbId: number;
  title: string;
  backgroundImage: string | null;
  status: GameLibraryStatus;
  score: number;
  released: string | null;
  metacritic: number | null;
  gameStatus: string;
  collectionId: number | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameLibraryEntry {
  igdbId: number;
  title: string;
  backgroundImage?: string | null;
  status?: GameLibraryStatus;
  score?: number;
  released?: string | null;
  metacritic?: number | null;
  gameStatus?: string;
}

export interface UpdateGameLibraryEntry {
  title?: string;
  backgroundImage?: string | null;
  status?: GameLibraryStatus;
  score?: number;
  released?: string | null;
  metacritic?: number | null;
  gameStatus?: string;
}

export const GAME_LIBRARY_STATUS_LABELS: Record<GameLibraryStatus, string> = {
  plan_to_play: "Pretendo Jogar",
  playing: "Jogando",
  beaten: "Zerado",
  dropped: "Abandonado",
};
