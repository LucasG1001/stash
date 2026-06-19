import type { GameCard } from "../types/game";
import type { GameLibraryEntry } from "../types/gameLibrary";

export function gameLibraryEntryToCard(entry: GameLibraryEntry): GameCard {
  return {
    id: entry.igdbId,
    title: entry.title,
    backgroundImage: entry.backgroundImage,
    released: entry.released,
    rating: null,
    metacritic: entry.metacritic,
    gameStatus: entry.gameStatus || "RELEASED",
    storeSlugs: [],
  };
}
