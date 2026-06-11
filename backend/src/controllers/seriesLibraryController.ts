import type { Request, Response } from "express";
import * as seriesLibraryModel from "../models/seriesLibraryModel.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const entries = await seriesLibraryModel.findAll();
    res.json(entries);
  } catch {
    res.status(500).json({ error: "Erro ao buscar biblioteca." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { tmdbId, title, posterImage, status, score, firstAirDate, seasons, episodes, seriesStatus } = req.body;

    if (!tmdbId || !title) {
      res.status(400).json({ error: "tmdbId e title são obrigatórios." });
      return;
    }

    const existing = await seriesLibraryModel.findByTmdbId(tmdbId);
    if (existing) {
      res.status(409).json({ error: "Série já está na biblioteca.", entry: existing });
      return;
    }

    const entry = await seriesLibraryModel.create({ tmdbId, title, posterImage, status, score, firstAirDate, seasons, episodes, seriesStatus });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao adicionar série à biblioteca." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { title, posterImage, status, score, firstAirDate, seasons, episodes, seriesStatus } = req.body;

    const entry = await seriesLibraryModel.update(id, { title, posterImage, status, score, firstAirDate, seasons, episodes, seriesStatus });
    if (!entry) {
      res.status(404).json({ error: "Série não encontrada na biblioteca." });
      return;
    }

    res.json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar série na biblioteca." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const deleted = await seriesLibraryModel.remove(id);
    if (!deleted) {
      res.status(404).json({ error: "Série não encontrada na biblioteca." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover série da biblioteca." });
  }
}
