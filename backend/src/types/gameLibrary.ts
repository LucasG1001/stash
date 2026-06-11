export type GameLibraryStatus = "plan_to_play" | "playing" | "beaten" | "dropped";

export interface GameLibraryEntry {
  id: string;
  rawgId: number;
  title: string;
  backgroundImage: string | null;
  status: GameLibraryStatus;
  score: number;
  released: string | null;
  metacritic: number | null;
  gameStatus: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameLibraryEntry {
  rawgId: number;
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

export interface GameLibraryRow {
  id: string;
  rawg_id: number;
  title: string;
  background_image: string | null;
  status: GameLibraryStatus;
  score: string;
  released: string | null;
  metacritic: number | null;
  game_status: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}
