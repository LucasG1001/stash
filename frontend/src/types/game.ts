export interface GameStore {
  name: string;
  url: string;
}

export interface GameTrailer {
  url: string;
  preview: string | null;
}

export interface GameCard {
  id: number;
  title: string;
  backgroundImage: string | null;
  released: string | null;
  rating: number | null;
  metacritic: number | null;
  gameStatus: string;
}

export interface GameDetail extends GameCard {
  description: string | null;
  website: string | null;
  developers: string[];
  publishers: string[];
  platforms: string[];
  genres: string[];
  esrb: string | null;
  stores: GameStore[];
  trailer: GameTrailer | null;
  screenshots: string[];
  ratingsCount: number | null;
}

export interface PageInfo {
  total: number;
  currentPage: number;
  hasNextPage: boolean;
}

export interface GameListResponse {
  games: GameCard[];
  pageInfo: PageInfo;
}
