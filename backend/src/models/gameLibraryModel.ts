import { createLibraryModel } from "../lib/createLibraryModel.js";
import type { GameLibraryEntry, CreateGameLibraryEntry, UpdateGameLibraryEntry } from "../types/gameLibrary.js";

export const gameLibraryModel = createLibraryModel<GameLibraryEntry, CreateGameLibraryEntry, UpdateGameLibraryEntry>({
  table: "game_library",
  externalId: { column: "rawg_id", field: "rawgId" },
  fields: [
    { column: "title", field: "title" },
    { column: "background_image", field: "backgroundImage", default: null },
    { column: "status", field: "status", default: "plan_to_play" },
    { column: "score", field: "score", default: 0, numeric: true },
    { column: "released", field: "released", default: null },
    { column: "metacritic", field: "metacritic", default: null },
    { column: "game_status", field: "gameStatus", default: "RELEASED" },
  ],
  statusField: "status",
  completion: { column: "finished_at", field: "finishedAt", whenStatus: "beaten" },
});
