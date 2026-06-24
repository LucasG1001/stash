import { pool } from "../database/connection.js";

export interface FieldSpec {
  column: string;
  field: string;
  default?: unknown;
  numeric?: boolean;
  readonly?: boolean;
}

export interface LibraryModelConfig {
  table: string;
  externalId: { column: string; field: string };
  fields: FieldSpec[];
  statusField: string;
  completion: { column: string; field: string; whenStatus: string };
  collectionColumn?: string;
}

export interface LibraryModel<TEntry, TCreate, TUpdate> {
  findAll(): Promise<TEntry[]>;
  findById(id: string): Promise<TEntry | null>;
  findByExternalId(externalId: number | string): Promise<TEntry | null>;
  create(entry: TCreate): Promise<TEntry>;
  update(id: string, data: TUpdate): Promise<TEntry | null>;
  remove(id: string): Promise<boolean>;
  removeMany(ids: string[]): Promise<number>;
  setCover?(id: string): Promise<TEntry | null>;
}

type Row = Record<string, unknown>;

export function createLibraryModel<TEntry, TCreate, TUpdate>(
  config: LibraryModelConfig
): LibraryModel<TEntry, TCreate, TUpdate> {
  const { table, externalId, fields, statusField, completion, collectionColumn } = config;

  const toEntry = (row: Row): TEntry => {
    const entry: Row = { id: row.id };
    entry[externalId.field] = row[externalId.column];
    for (const f of fields) {
      const value = row[f.column];
      entry[f.field] = f.numeric ? parseFloat(value as string) : value;
    }
    entry[completion.field] = row[completion.column];
    entry.createdAt = row.created_at;
    entry.updatedAt = row.updated_at;
    return entry as TEntry;
  };

  const findAll = async (): Promise<TEntry[]> => {
    const result = await pool.query<Row>(`SELECT * FROM ${table} ORDER BY updated_at DESC`);
    return result.rows.map(toEntry);
  };

  const findById = async (id: string): Promise<TEntry | null> => {
    const result = await pool.query<Row>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return result.rows[0] ? toEntry(result.rows[0]) : null;
  };

  const findByExternalId = async (value: number | string): Promise<TEntry | null> => {
    const result = await pool.query<Row>(`SELECT * FROM ${table} WHERE ${externalId.column} = $1`, [value]);
    return result.rows[0] ? toEntry(result.rows[0]) : null;
  };

  const create = async (entry: TCreate): Promise<TEntry> => {
    const data = entry as Row;
    const insertable = fields.filter((f) => !f.readonly);
    const insertCols = [externalId.column, ...insertable.map((f) => f.column)];
    const values: unknown[] = [
      data[externalId.field],
      ...insertable.map((f) => {
        const value = data[f.field];
        return value === undefined ? f.default ?? null : value;
      }),
    ];
    const placeholders = values.map((_, i) => `$${i + 1}`);
    const statusParam = insertable.findIndex((f) => f.field === statusField) + 2;
    insertCols.push(completion.column);
    placeholders.push(`CASE WHEN $${statusParam} = '${completion.whenStatus}' THEN NOW() ELSE NULL END`);
    const result = await pool.query<Row>(
      `INSERT INTO ${table} (${insertCols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
      values
    );
    return toEntry(result.rows[0]);
  };

  const update = async (id: string, data: TUpdate): Promise<TEntry | null> => {
    const patch = data as Row;
    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    for (const f of fields) {
      if (f.readonly) continue;
      if (patch[f.field] === undefined) continue;
      if (f.field === statusField) {
        const statusParam = index++;
        sets.push(`${f.column} = $${statusParam}`);
        values.push(patch[f.field]);
        sets.push(
          `${completion.column} = CASE
             WHEN $${statusParam} = '${completion.whenStatus}' AND ${f.column} != '${completion.whenStatus}' THEN NOW()
             WHEN $${statusParam} != '${completion.whenStatus}' THEN NULL
             ELSE ${completion.column}
           END`
        );
      } else {
        sets.push(`${f.column} = $${index++}`);
        values.push(patch[f.field]);
      }
    }

    if (sets.length === 0) return findById(id);

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query<Row>(
      `UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${index} RETURNING *`,
      values
    );
    return result.rows[0] ? toEntry(result.rows[0]) : null;
  };

  const remove = async (id: string): Promise<boolean> => {
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  };

  const removeMany = async (ids: string[]): Promise<number> => {
    if (ids.length === 0) return 0;
    const result = await pool.query(`DELETE FROM ${table} WHERE id = ANY($1::uuid[])`, [ids]);
    return result.rowCount ?? 0;
  };

  const setCover = async (id: string): Promise<TEntry | null> => {
    const col = collectionColumn as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE ${table} SET is_cover = FALSE
         WHERE ${col} = (SELECT ${col} FROM ${table} WHERE id = $1) AND ${col} IS NOT NULL`,
        [id]
      );
      const result = await client.query<Row>(
        `UPDATE ${table} SET is_cover = TRUE WHERE id = $1 RETURNING *`,
        [id]
      );
      await client.query("COMMIT");
      return result.rows[0] ? toEntry(result.rows[0]) : null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };

  const model: LibraryModel<TEntry, TCreate, TUpdate> = {
    findAll,
    findById,
    findByExternalId,
    create,
    update,
    remove,
    removeMany,
  };
  if (collectionColumn) model.setCover = setCover;
  return model;
}
