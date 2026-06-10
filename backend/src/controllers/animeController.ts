import type { Request, Response } from "express";
import { fetchSeasonAnimes, fetchPopularAnimes, searchAnimes, fetchAnimeById } from "../services/anilistService.js";

export async function getCurrentSeason(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchSeasonAnimes("current", page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar animes da temporada atual." });
  }
}

export async function getNextSeason(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchSeasonAnimes("next", page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar animes da próxima temporada." });
  }
}

export async function getPopular(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchPopularAnimes(page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar animes populares." });
  }
}

export async function search(req: Request, res: Response): Promise<void> {
  try {
    const query = String(req.query.q || "");
    if (!query) {
      res.status(400).json({ error: "Parâmetro de busca é obrigatório." });
      return;
    }
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await searchAnimes(query, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar animes." });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    const anime = await fetchAnimeById(id);
    res.json(anime);
  } catch {
    res.status(500).json({ error: "Erro ao buscar detalhes do anime." });
  }
}
