import { pool } from "../database/connection.js";
import { createLibraryModel } from "../lib/createLibraryModel.js";
import type { GameLibraryEntry, CreateGameLibraryEntry, UpdateGameLibraryEntry, GameLibraryRow } from "../types/gameLibrary.js";

export const gameLibraryModel = createLibraryModel<GameLibraryEntry, CreateGameLibraryEntry, UpdateGameLibraryEntry>({
  table: "game_library",
  externalId: { column: "igdb_id", field: "igdbId" },
  fields: [
    { column: "title", field: "title" },
    { column: "background_image", field: "backgroundImage", default: null },
    { column: "status", field: "status", default: "plan_to_play" },
    { column: "score", field: "score", default: 0, numeric: true },
    { column: "released", field: "released", default: null },
    { column: "metacritic", field: "metacritic", default: null },
    { column: "game_status", field: "gameStatus", default: "RELEASED" },
    { column: "collection_id", field: "collectionId", default: null },
  ],
  statusField: "status",
  completion: { column: "finished_at", field: "finishedAt", whenStatus: "beaten" },
});

function toEntry(row: GameLibraryRow): GameLibraryEntry {
  return {
    id: row.id,
    igdbId: row.igdb_id,
    title: row.title,
    backgroundImage: row.background_image,
    status: row.status,
    score: parseFloat(row.score),
    released: row.released,
    metacritic: row.metacritic,
    gameStatus: row.game_status,
    collectionId: row.collection_id,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function bulkUpsertGames(entries: CreateGameLibraryEntry[], collectionId: number): Promise<GameLibraryEntry[]> {
  if (entries.length === 0) return [];

  const values: unknown[] = [];
  const rows: string[] = [];
  let i = 1;

  for (const entry of entries) {
    const statusParam = `$${i + 3}`;
    rows.push(
      `($${i}, $${i + 1}, $${i + 2}, ${statusParam}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7}, $${i + 8}, CASE WHEN ${statusParam} = 'beaten' THEN NOW() ELSE NULL END)`
    );
    values.push(
      entry.igdbId,
      entry.title,
      entry.backgroundImage ?? null,
      entry.status ?? "plan_to_play",
      entry.score ?? 0,
      entry.released ?? null,
      entry.metacritic ?? null,
      entry.gameStatus ?? "RELEASED",
      collectionId
    );
    i += 9;
  }

  const result = await pool.query<GameLibraryRow>(
    `INSERT INTO game_library
       (igdb_id, title, background_image, status, score, released, metacritic, game_status, collection_id, finished_at)
     VALUES ${rows.join(", ")}
     ON CONFLICT (igdb_id) DO UPDATE SET
       collection_id = COALESCE(game_library.collection_id, EXCLUDED.collection_id)
     RETURNING *`,
    values
  );
  return result.rows.map(toEntry);
}
