import { pool } from "../database/connection.js";
import type { GameLibraryEntry, GameLibraryRow, CreateGameLibraryEntry, UpdateGameLibraryEntry } from "../types/gameLibrary.js";

function toGameLibraryEntry(row: GameLibraryRow): GameLibraryEntry {
  return {
    id: row.id,
    rawgId: row.rawg_id,
    title: row.title,
    backgroundImage: row.background_image,
    status: row.status,
    score: parseFloat(row.score),
    released: row.released,
    metacritic: row.metacritic,
    gameStatus: row.game_status,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<GameLibraryEntry[]> {
  const result = await pool.query<GameLibraryRow>("SELECT * FROM game_library ORDER BY updated_at DESC");
  return result.rows.map(toGameLibraryEntry);
}

export async function findById(id: string): Promise<GameLibraryEntry | null> {
  const result = await pool.query<GameLibraryRow>("SELECT * FROM game_library WHERE id = $1", [id]);
  return result.rows[0] ? toGameLibraryEntry(result.rows[0]) : null;
}

export async function findByRawgId(rawgId: number): Promise<GameLibraryEntry | null> {
  const result = await pool.query<GameLibraryRow>("SELECT * FROM game_library WHERE rawg_id = $1", [rawgId]);
  return result.rows[0] ? toGameLibraryEntry(result.rows[0]) : null;
}

export async function create(entry: CreateGameLibraryEntry): Promise<GameLibraryEntry> {
  const result = await pool.query<GameLibraryRow>(
    `INSERT INTO game_library
       (rawg_id, title, background_image, status, score, released, metacritic, game_status, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $4 = 'beaten' THEN NOW() ELSE NULL END)
     RETURNING *`,
    [
      entry.rawgId,
      entry.title,
      entry.backgroundImage ?? null,
      entry.status ?? "plan_to_play",
      entry.score ?? 0,
      entry.released ?? null,
      entry.metacritic ?? null,
      entry.gameStatus ?? "RELEASED",
    ]
  );
  return toGameLibraryEntry(result.rows[0]);
}

export async function update(id: string, data: UpdateGameLibraryEntry): Promise<GameLibraryEntry | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.backgroundImage !== undefined) {
    fields.push(`background_image = $${paramIndex++}`);
    values.push(data.backgroundImage);
  }
  if (data.status !== undefined) {
    const statusParam = paramIndex++;
    fields.push(`status = $${statusParam}`);
    values.push(data.status);
    fields.push(
      `finished_at = CASE
         WHEN $${statusParam} = 'beaten' AND status != 'beaten' THEN NOW()
         WHEN $${statusParam} != 'beaten' THEN NULL
         ELSE finished_at
       END`
    );
  }
  if (data.score !== undefined) {
    fields.push(`score = $${paramIndex++}`);
    values.push(data.score);
  }
  if (data.released !== undefined) {
    fields.push(`released = $${paramIndex++}`);
    values.push(data.released);
  }
  if (data.metacritic !== undefined) {
    fields.push(`metacritic = $${paramIndex++}`);
    values.push(data.metacritic);
  }
  if (data.gameStatus !== undefined) {
    fields.push(`game_status = $${paramIndex++}`);
    values.push(data.gameStatus);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<GameLibraryRow>(
    `UPDATE game_library SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toGameLibraryEntry(result.rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM game_library WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
