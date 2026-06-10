import { pool } from "../database/connection.js";
import type { LibraryEntry, LibraryRow, CreateLibraryEntry, UpdateLibraryEntry } from "../types/library.js";

function toLibraryEntry(row: LibraryRow): LibraryEntry {
  return {
    id: row.id,
    anilistId: row.anilist_id,
    title: row.title,
    coverImage: row.cover_image,
    status: row.status,
    score: parseFloat(row.score),
    watchedEpisodes: row.watched_episodes,
    totalEpisodes: row.total_episodes,
    animeStatus: row.anime_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<LibraryEntry[]> {
  const result = await pool.query<LibraryRow>("SELECT * FROM anime_library ORDER BY updated_at DESC");
  return result.rows.map(toLibraryEntry);
}

export async function findById(id: string): Promise<LibraryEntry | null> {
  const result = await pool.query<LibraryRow>("SELECT * FROM anime_library WHERE id = $1", [id]);
  return result.rows[0] ? toLibraryEntry(result.rows[0]) : null;
}

export async function findByAnilistId(anilistId: number): Promise<LibraryEntry | null> {
  const result = await pool.query<LibraryRow>("SELECT * FROM anime_library WHERE anilist_id = $1", [anilistId]);
  return result.rows[0] ? toLibraryEntry(result.rows[0]) : null;
}

export async function create(entry: CreateLibraryEntry): Promise<LibraryEntry> {
  const result = await pool.query<LibraryRow>(
    `INSERT INTO anime_library (anilist_id, title, cover_image, status, score, watched_episodes, total_episodes, anime_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      entry.anilistId,
      entry.title,
      entry.coverImage ?? null,
      entry.status ?? "plan_to_watch",
      entry.score ?? 0,
      entry.watchedEpisodes ?? 0,
      entry.totalEpisodes ?? null,
      entry.animeStatus ?? "FINISHED",
    ]
  );
  return toLibraryEntry(result.rows[0]);
}

export async function update(id: string, data: UpdateLibraryEntry): Promise<LibraryEntry | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.coverImage !== undefined) {
    fields.push(`cover_image = $${paramIndex++}`);
    values.push(data.coverImage);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  if (data.score !== undefined) {
    fields.push(`score = $${paramIndex++}`);
    values.push(data.score);
  }
  if (data.watchedEpisodes !== undefined) {
    fields.push(`watched_episodes = $${paramIndex++}`);
    values.push(data.watchedEpisodes);
  }
  if (data.totalEpisodes !== undefined) {
    fields.push(`total_episodes = $${paramIndex++}`);
    values.push(data.totalEpisodes);
  }
  if (data.animeStatus !== undefined) {
    fields.push(`anime_status = $${paramIndex++}`);
    values.push(data.animeStatus);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<LibraryRow>(
    `UPDATE anime_library SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toLibraryEntry(result.rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM anime_library WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
