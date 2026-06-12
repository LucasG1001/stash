import { pool } from "../database/connection.js";
import type { BookLibraryEntry, BookLibraryRow, CreateBookLibraryEntry, UpdateBookLibraryEntry } from "../types/bookLibrary.js";

function toBookLibraryEntry(row: BookLibraryRow): BookLibraryEntry {
  return {
    id: row.id,
    googleBooksId: row.google_books_id,
    title: row.title,
    coverImage: row.cover_image,
    authors: row.authors,
    status: row.status,
    score: parseFloat(row.score),
    publishedDate: row.published_date,
    pageCount: row.page_count,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<BookLibraryEntry[]> {
  const result = await pool.query<BookLibraryRow>("SELECT * FROM books_library ORDER BY updated_at DESC");
  return result.rows.map(toBookLibraryEntry);
}

export async function findById(id: string): Promise<BookLibraryEntry | null> {
  const result = await pool.query<BookLibraryRow>("SELECT * FROM books_library WHERE id = $1", [id]);
  return result.rows[0] ? toBookLibraryEntry(result.rows[0]) : null;
}

export async function findByGoogleBooksId(googleBooksId: string): Promise<BookLibraryEntry | null> {
  const result = await pool.query<BookLibraryRow>("SELECT * FROM books_library WHERE google_books_id = $1", [googleBooksId]);
  return result.rows[0] ? toBookLibraryEntry(result.rows[0]) : null;
}

export async function create(entry: CreateBookLibraryEntry): Promise<BookLibraryEntry> {
  const result = await pool.query<BookLibraryRow>(
    `INSERT INTO books_library
       (google_books_id, title, cover_image, authors, status, score, published_date, page_count, read_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $5 = 'read' THEN NOW() ELSE NULL END)
     RETURNING *`,
    [
      entry.googleBooksId,
      entry.title,
      entry.coverImage ?? null,
      entry.authors ?? null,
      entry.status ?? "plan_to_read",
      entry.score ?? 0,
      entry.publishedDate ?? null,
      entry.pageCount ?? null,
    ]
  );
  return toBookLibraryEntry(result.rows[0]);
}

export async function update(id: string, data: UpdateBookLibraryEntry): Promise<BookLibraryEntry | null> {
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
  if (data.authors !== undefined) {
    fields.push(`authors = $${paramIndex++}`);
    values.push(data.authors);
  }
  if (data.status !== undefined) {
    const statusParam = paramIndex++;
    fields.push(`status = $${statusParam}`);
    values.push(data.status);
    fields.push(
      `read_at = CASE
         WHEN $${statusParam} = 'read' AND status != 'read' THEN NOW()
         WHEN $${statusParam} != 'read' THEN NULL
         ELSE read_at
       END`
    );
  }
  if (data.score !== undefined) {
    fields.push(`score = $${paramIndex++}`);
    values.push(data.score);
  }
  if (data.publishedDate !== undefined) {
    fields.push(`published_date = $${paramIndex++}`);
    values.push(data.publishedDate);
  }
  if (data.pageCount !== undefined) {
    fields.push(`page_count = $${paramIndex++}`);
    values.push(data.pageCount);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<BookLibraryRow>(
    `UPDATE books_library SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toBookLibraryEntry(result.rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM books_library WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
