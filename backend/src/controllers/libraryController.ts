import type { Request, Response } from "express";
import * as libraryModel from "../models/libraryModel.js";
import { discoverFranchise } from "../services/anilistService.js";
import { refreshStaleEntries } from "../services/librarySyncService.js";
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
    const { anilistId, status, score } = parsed.data;

    const existing = await libraryModel.findByAnilistId(anilistId);
    if (existing) {
      res.status(409).json({ error: "Anime já está na biblioteca.", entry: existing });
      return;
    }

    const members = await discoverFranchise(anilistId);

    if (members.length === 0) {
      const entry = await libraryModel.create(parsed.data as unknown as CreateLibraryEntry);
      res.status(201).json([entry]);
      return;
    }

    const franchiseId = Math.min(...members.map((m) => m.id));
    const entries: CreateLibraryEntry[] = members.map((m) => ({
      anilistId: m.id,
      title: m.title,
      coverImage: m.coverImage,
      status: m.id === anilistId ? status ?? "plan_to_watch" : "plan_to_watch",
      score: m.id === anilistId ? score ?? 0 : 0,
      totalEpisodes: m.episodes,
      animeStatus: m.status,
      format: m.format,
      seasonYear: m.seasonYear,
      nextAiringEpisode: m.nextAiringEpisode,
      streamingLinks: m.streamingLinks,
    }));

    const group = await libraryModel.bulkUpsert(entries, franchiseId);
    group.sort((a, b) => (a.anilistId === anilistId ? -1 : b.anilistId === anilistId ? 1 : 0));
    res.status(201).json(group);
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

export async function removeMany(req: Request, res: Response): Promise<void> {
  try {
    const ids = (req.body as { ids?: unknown }).ids;
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      res.status(400).json({ error: "Dados inválidos." });
      return;
    }
    const deleted = await libraryModel.removeMany(ids as string[]);
    res.json({ deleted });
  } catch {
    res.status(500).json({ error: "Erro ao remover anime da biblioteca." });
  }
}
