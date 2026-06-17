import type { Request, Response } from "express";
import * as libraryModel from "../models/libraryModel.js";
import { refreshStaleEntries } from "../services/librarySyncService.js";
import { notifyAnimeAdded } from "../services/notifyService.js";
import { animeCreateSchema, animeUpdateSchema } from "../schemas/library.js";
import type { CreateLibraryEntry } from "../types/library.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    await refreshStaleEntries();
    const entries = await libraryModel.findAll();
    res.json(entries);
  } catch {
    res.status(500).json({ error: "Erro ao buscar biblioteca." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = animeCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos.", issues: parsed.error.flatten() });
      return;
    }
    const { anilistId, title, coverImage, status, score, totalEpisodes, animeStatus, seasonYear, nextAiringEpisode, streamingLinks } = parsed.data;

    const existing = await libraryModel.findByAnilistId(anilistId);
    if (existing) {
      res.status(409).json({ error: "Anime já está na biblioteca.", entry: existing });
      return;
    }

    const entry = await libraryModel.create(
      { anilistId, title, coverImage, status, score, totalEpisodes, animeStatus, seasonYear, nextAiringEpisode, streamingLinks } as unknown as CreateLibraryEntry
    );
    void notifyAnimeAdded(entry);
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao adicionar anime à biblioteca." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const parsed = animeUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos.", issues: parsed.error.flatten() });
      return;
    }
    const { title, coverImage, status, score, totalEpisodes, animeStatus } = parsed.data;

    const entry = await libraryModel.update(id, { title, coverImage, status, score, totalEpisodes, animeStatus });
    if (!entry) {
      res.status(404).json({ error: "Anime não encontrado na biblioteca." });
      return;
    }

    res.json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar anime na biblioteca." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const deleted = await libraryModel.remove(id);
    if (!deleted) {
      res.status(404).json({ error: "Anime não encontrado na biblioteca." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover anime da biblioteca." });
  }
}
