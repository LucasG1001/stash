import type { Request, Response } from "express";
import { createLibraryController } from "../lib/createLibraryController.js";
import { bookLibraryModel, bulkUpsertBooks } from "../models/bookLibraryModel.js";
import { discoverBooksByAuthor } from "../services/googleBooksService.js";
import { bookCreateSchema, bookUpdateSchema } from "../schemas/library.js";
import type { CreateBookLibraryEntry } from "../types/bookLibrary.js";
import { notifyError } from "../services/notifyService.js";

const base = createLibraryController({
  model: bookLibraryModel,
  externalIdField: "googleBooksId",
  createSchema: bookCreateSchema,
  updateSchema: bookUpdateSchema,
  messages: {
    required: "googleBooksId e title são obrigatórios.",
    invalid: "Dados inválidos.",
    duplicate: "Livro já está na biblioteca.",
    notFound: "Livro não encontrado na biblioteca.",
    errorGetAll: "Erro ao buscar biblioteca.",
    errorCreate: "Erro ao adicionar livro à biblioteca.",
    errorUpdate: "Erro ao atualizar livro na biblioteca.",
    errorRemove: "Erro ao remover livro da biblioteca.",
  },
});

export const { getAll, update, setCover, remove, removeMany } = base;

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = bookCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos.", issues: parsed.error.flatten() });
      return;
    }
    const data = parsed.data as CreateBookLibraryEntry;
    if (!data.googleBooksId || !data.title) {
      res.status(400).json({ error: "googleBooksId e title são obrigatórios." });
      return;
    }

    const existing = await bookLibraryModel.findByExternalId(data.googleBooksId);
    if (existing) {
      res.status(409).json({ error: "Livro já está na biblioteca.", entry: existing });
      return;
    }

    const seed: CreateBookLibraryEntry = {
      googleBooksId: data.googleBooksId,
      title: data.title,
      coverImage: data.coverImage ?? null,
      authors: data.authors ?? null,
      status: data.status ?? "plan_to_read",
      score: data.score ?? 0,
      publishedDate: data.publishedDate ?? null,
      pageCount: data.pageCount ?? null,
    };

    const firstAuthor = data.authors?.split(",")[0]?.trim();
    const members = firstAuthor ? await discoverBooksByAuthor(firstAuthor) : [];

    const memberEntries: CreateBookLibraryEntry[] = members
      .filter((m) => m.id !== data.googleBooksId)
      .map((m) => ({
        googleBooksId: m.id,
        title: m.title,
        coverImage: m.coverImage,
        authors: m.authors.length > 0 ? m.authors.join(", ") : null,
        status: "plan_to_read",
        score: 0,
        publishedDate: m.publishedDate,
        pageCount: null,
      }));

    const group = await bulkUpsertBooks([seed, ...memberEntries]);
    group.sort((a, b) => (a.googleBooksId === data.googleBooksId ? -1 : b.googleBooksId === data.googleBooksId ? 1 : 0));
    res.status(201).json(group);
  } catch (error) {
    void notifyError("API POST /api/book-library", error);
    res.status(500).json({ error: "Erro ao adicionar livro à biblioteca." });
  }
}
