export interface RawgGenre {
  id: number;
  name: string;
}

export interface RawgPlatformWrapper {
  platform: { id: number; name: string };
}

export interface RawgShortScreenshot {
  id: number;
  image: string;
}

export interface RawgGameListItem {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number | null;
  ratings_count: number | null;
  metacritic: number | null;
  tba: boolean;
  genres: RawgGenre[];
  platforms: RawgPlatformWrapper[] | null;
  short_screenshots?: RawgShortScreenshot[];
}

export interface RawgStoreWrapper {
  url: string;
  store: { id: number; name: string };
}

export interface RawgGameDetail extends RawgGameListItem {
  description_raw: string | null;
  website: string | null;
  developers: { name: string }[];
  publishers: { name: string }[];
  stores: RawgStoreWrapper[] | null;
  esrb_rating: { name: string } | null;
}

export interface RawgListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGameListItem[];
}

export interface RawgMovie {
  id: number;
  preview: string | null;
  data: { 480?: string; max?: string };
}

export interface RawgMoviesResponse {
  results: RawgMovie[];
}

export interface RawgScreenshot {
  id: number;
  image: string;
}

export interface RawgScreenshotsResponse {
  results: RawgScreenshot[];
}

export interface RawgStoreLink {
  id: number;
  store_id: number;
  url: string;
}

export interface RawgStoresResponse {
  results: RawgStoreLink[];
}

export interface GamePageInfo {
  total: number;
  currentPage: number;
  hasNextPage: boolean;
}

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

export interface GameListResult {
  games: GameCard[];
  pageInfo: GamePageInfo;
}
