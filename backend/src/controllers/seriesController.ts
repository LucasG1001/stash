import type { Request, Response } from "express";
import { fetchPopularSeries, searchSeries, fetchSeriesById } from "../services/tmdbSeriesService.js";

export async function getPopular(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const reqMonth = req.query.month ? parseInt(String(req.query.month)) : NaN;
    const reqYear = req.query.year ? parseInt(String(req.query.year)) : NaN;

    const month = !isNaN(reqMonth) && reqMonth >= 1 && reqMonth <= 12 ? reqMonth : undefined;
    const year = !isNaN(reqYear) ? reqYear : now.getFullYear();

    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchPopularSeries(year, month, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar séries populares." });
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
    const result = await searchSeries(query, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar séries." });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    const series = await fetchSeriesById(id);
    res.json(series);
  } catch {
    res.status(500).json({ error: "Erro ao buscar detalhes da série." });
  }
}
