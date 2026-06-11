import { pool } from "../database/connection.js";
import type { SeriesLibraryEntry, SeriesLibraryRow, CreateSeriesLibraryEntry, UpdateSeriesLibraryEntry } from "../types/seriesLibrary.js";

function toSeriesLibraryEntry(row: SeriesLibraryRow): SeriesLibraryEntry {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    title: row.title,
    posterImage: row.poster_image,
    status: row.status,
    score: parseFloat(row.score),
    firstAirDate: row.first_air_date,
    seasons: row.seasons,
    episodes: row.episodes,
    seriesStatus: row.series_status,
    watchedAt: row.watched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<SeriesLibraryEntry[]> {
  const result = await pool.query<SeriesLibraryRow>("SELECT * FROM series_library ORDER BY updated_at DESC");
  return result.rows.map(toSeriesLibraryEntry);
}

export async function findById(id: string): Promise<SeriesLibraryEntry | null> {
  const result = await pool.query<SeriesLibraryRow>("SELECT * FROM series_library WHERE id = $1", [id]);
  return result.rows[0] ? toSeriesLibraryEntry(result.rows[0]) : null;
}

export async function findByTmdbId(tmdbId: number): Promise<SeriesLibraryEntry | null> {
  const result = await pool.query<SeriesLibraryRow>("SELECT * FROM series_library WHERE tmdb_id = $1", [tmdbId]);
  return result.rows[0] ? toSeriesLibraryEntry(result.rows[0]) : null;
}

export async function create(entry: CreateSeriesLibraryEntry): Promise<SeriesLibraryEntry> {
  const result = await pool.query<SeriesLibraryRow>(
    `INSERT INTO series_library
       (tmdb_id, title, poster_image, status, score, first_air_date, seasons, episodes, series_status, watched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $4 = 'watched' THEN NOW() ELSE NULL END)
     RETURNING *`,
    [
      entry.tmdbId,
      entry.title,
      entry.posterImage ?? null,
      entry.status ?? "plan_to_watch",
      entry.score ?? 0,
      entry.firstAirDate ?? null,
      entry.seasons ?? null,
      entry.episodes ?? null,
      entry.seriesStatus ?? "RELEASED",
    ]
  );
  return toSeriesLibraryEntry(result.rows[0]);
}

export async function update(id: string, data: UpdateSeriesLibraryEntry): Promise<SeriesLibraryEntry | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.posterImage !== undefined) {
    fields.push(`poster_image = $${paramIndex++}`);
    values.push(data.posterImage);
  }
  if (data.status !== undefined) {
    const statusParam = paramIndex++;
    fields.push(`status = $${statusParam}`);
    values.push(data.status);
    fields.push(
      `watched_at = CASE
         WHEN $${statusParam} = 'watched' AND status != 'watched' THEN NOW()
         WHEN $${statusParam} != 'watched' THEN NULL
         ELSE watched_at
       END`
    );
  }
  if (data.score !== undefined) {
    fields.push(`score = $${paramIndex++}`);
    values.push(data.score);
  }
  if (data.firstAirDate !== undefined) {
    fields.push(`first_air_date = $${paramIndex++}`);
    values.push(data.firstAirDate);
  }
  if (data.seasons !== undefined) {
    fields.push(`seasons = $${paramIndex++}`);
    values.push(data.seasons);
  }
  if (data.episodes !== undefined) {
    fields.push(`episodes = $${paramIndex++}`);
    values.push(data.episodes);
  }
  if (data.seriesStatus !== undefined) {
    fields.push(`series_status = $${paramIndex++}`);
    values.push(data.seriesStatus);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<SeriesLibraryRow>(
    `UPDATE series_library SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toSeriesLibraryEntry(result.rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM series_library WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
