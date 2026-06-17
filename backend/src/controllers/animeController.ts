import type { Request, Response } from "express";
import { fetchSeasonAnimes, fetchPopularAnimes, searchAnimes, fetchAnimeById, getCurrentSeason } from "../services/anilistService.js";

export async function getSeason(req: Request, res: Response): Promise<void> {
  try {
    const reqSeason = req.query.season as string;
    const reqYear = req.query.year ? parseInt(String(req.query.year)) : NaN;
    
    let season: string;
    let year: number;
    
    if (reqSeason && !isNaN(reqYear)) {
      season = reqSeason.toUpperCase();
      year = reqYear;
    } else {
      const current = getCurrentSeason();
      season = current.season;
      year = current.year;
    }

    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchSeasonAnimes(season, year, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar animes da temporada." });
  }
}

export async function getPopular(req: Request, res: Response): Promise<void> {
  try {
    const reqYear = parseInt(String(req.query.year));
    const year = !isNaN(reqYear) ? reqYear : undefined;
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchPopularAnimes(page, year);
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
