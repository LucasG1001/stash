import { pool } from "../database/connection.js";
import type { MovieLibraryEntry, MovieLibraryRow, CreateMovieLibraryEntry, UpdateMovieLibraryEntry } from "../types/movieLibrary.js";

function toMovieLibraryEntry(row: MovieLibraryRow): MovieLibraryEntry {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    title: row.title,
    posterImage: row.poster_image,
    status: row.status,
    score: parseFloat(row.score),
    releaseDate: row.release_date,
    runtime: row.runtime,
    movieStatus: row.movie_status,
    watchedAt: row.watched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<MovieLibraryEntry[]> {
  const result = await pool.query<MovieLibraryRow>("SELECT * FROM movie_library ORDER BY updated_at DESC");
  return result.rows.map(toMovieLibraryEntry);
}

export async function findById(id: string): Promise<MovieLibraryEntry | null> {
  const result = await pool.query<MovieLibraryRow>("SELECT * FROM movie_library WHERE id = $1", [id]);
  return result.rows[0] ? toMovieLibraryEntry(result.rows[0]) : null;
}

export async function findByTmdbId(tmdbId: number): Promise<MovieLibraryEntry | null> {
  const result = await pool.query<MovieLibraryRow>("SELECT * FROM movie_library WHERE tmdb_id = $1", [tmdbId]);
  return result.rows[0] ? toMovieLibraryEntry(result.rows[0]) : null;
}

export async function create(entry: CreateMovieLibraryEntry): Promise<MovieLibraryEntry> {
  const result = await pool.query<MovieLibraryRow>(
    `INSERT INTO movie_library
       (tmdb_id, title, poster_image, status, score, release_date, runtime, movie_status, watched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $4 = 'watched' THEN NOW() ELSE NULL END)
     RETURNING *`,
    [
      entry.tmdbId,
      entry.title,
      entry.posterImage ?? null,
      entry.status ?? "plan_to_watch",
      entry.score ?? 0,
      entry.releaseDate ?? null,
      entry.runtime ?? null,
      entry.movieStatus ?? "RELEASED",
    ]
  );
  return toMovieLibraryEntry(result.rows[0]);
}

export async function update(id: string, data: UpdateMovieLibraryEntry): Promise<MovieLibraryEntry | null> {
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
  if (data.releaseDate !== undefined) {
    fields.push(`release_date = $${paramIndex++}`);
    values.push(data.releaseDate);
  }
  if (data.runtime !== undefined) {
    fields.push(`runtime = $${paramIndex++}`);
    values.push(data.runtime);
  }
  if (data.movieStatus !== undefined) {
    fields.push(`movie_status = $${paramIndex++}`);
    values.push(data.movieStatus);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<MovieLibraryRow>(
    `UPDATE movie_library SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toMovieLibraryEntry(result.rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM movie_library WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
