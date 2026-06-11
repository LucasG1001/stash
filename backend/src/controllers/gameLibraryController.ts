import type { Request, Response } from "express";
import * as gameLibraryModel from "../models/gameLibraryModel.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const entries = await gameLibraryModel.findAll();
    res.json(entries);
  } catch {
    res.status(500).json({ error: "Erro ao buscar biblioteca." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { rawgId, title, backgroundImage, status, score, released, metacritic, gameStatus } = req.body;

    if (!rawgId || !title) {
      res.status(400).json({ error: "rawgId e title são obrigatórios." });
      return;
    }

    const existing = await gameLibraryModel.findByRawgId(rawgId);
    if (existing) {
      res.status(409).json({ error: "Jogo já está na biblioteca.", entry: existing });
      return;
    }

    const entry = await gameLibraryModel.create({ rawgId, title, backgroundImage, status, score, released, metacritic, gameStatus });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao adicionar jogo à biblioteca." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { title, backgroundImage, status, score, released, metacritic, gameStatus } = req.body;

    const entry = await gameLibraryModel.update(id, { title, backgroundImage, status, score, released, metacritic, gameStatus });
    if (!entry) {
      res.status(404).json({ error: "Jogo não encontrado na biblioteca." });
      return;
    }

    res.json(entry);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar jogo na biblioteca." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const deleted = await gameLibraryModel.remove(id);
    if (!deleted) {
      res.status(404).json({ error: "Jogo não encontrado na biblioteca." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover jogo da biblioteca." });
  }
}
