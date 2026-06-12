import type { Request, Response } from "express";
import * as bookLibraryModel from "../models/bookLibraryModel.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const entries = await bookLibraryModel.findAll();
    res.json(entries);
  } catch {
    res.status(500).json({ error: "Erro ao buscar biblioteca." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { googleBooksId, title, coverImage, authors, status, score, publishedDate, pageCount } = req.body;

    if (!googleBooksId || !title) {
      res.status(400).json({ error: "googleBooksId e title são obrigatórios." });
      return;
    }

    const existing = await bookLibraryModel.findByGoogleBooksId(googleBooksId);
    if (existing) {
      res.status(409).json({ error: "Livro já está na biblioteca.", entry: existing });
      return;
    }

    const entry = await bookLibraryModel.create({ googleBooksId, title, coverImage, authors, status, score, publishedDate, pageCount });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao adicionar livro à biblioteca." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { title, coverImage, authors, status, score, publishedDate, pageCount } = req.body;

    const entry = await bookLibraryModel.update(id, { title, coverImage, authors, status, score, publishedDate, pageCount });
    if (!entry) {
      res.status(404).json({ error: "Livro não encontrado na biblioteca." });
      return;
    }

    res.json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar livro na biblioteca." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const deleted = await bookLibraryModel.remove(id);
    if (!deleted) {
      res.status(404).json({ error: "Livro não encontrado na biblioteca." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover livro da biblioteca." });
  }
}
