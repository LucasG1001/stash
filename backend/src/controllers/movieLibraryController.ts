import type { Request, Response } from "express";
import * as movieLibraryModel from "../models/movieLibraryModel.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const entries = await movieLibraryModel.findAll();
    res.json(entries);
  } catch {
    res.status(500).json({ error: "Erro ao buscar biblioteca." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { tmdbId, title, posterImage, status, score, releaseDate, runtime, movieStatus } = req.body;

    if (!tmdbId || !title) {
      res.status(400).json({ error: "tmdbId e title são obrigatórios." });
      return;
    }

    const existing = await movieLibraryModel.findByTmdbId(tmdbId);
    if (existing) {
      res.status(409).json({ error: "Filme já está na biblioteca.", entry: existing });
      return;
    }

    const entry = await movieLibraryModel.create({ tmdbId, title, posterImage, status, score, releaseDate, runtime, movieStatus });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao adicionar filme à biblioteca." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { title, posterImage, status, score, releaseDate, runtime, movieStatus } = req.body;

    const entry = await movieLibraryModel.update(id, { title, posterImage, status, score, releaseDate, runtime, movieStatus });
    if (!entry) {
      res.status(404).json({ error: "Filme não encontrado na biblioteca." });
      return;
    }

    res.json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar filme na biblioteca." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const deleted = await movieLibraryModel.remove(id);
    if (!deleted) {
      res.status(404).json({ error: "Filme não encontrado na biblioteca." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover filme da biblioteca." });
  }
}
