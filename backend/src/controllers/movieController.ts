import type { Request, Response } from "express";
import { fetchPopularMovies, fetchNowPlayingMovies, searchMovies, fetchMovieById } from "../services/tmdbService.js";

export async function getPopular(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const reqMonth = req.query.month ? parseInt(String(req.query.month)) : NaN;
    const reqYear = req.query.year ? parseInt(String(req.query.year)) : NaN;

    const month = !isNaN(reqMonth) && reqMonth >= 1 && reqMonth <= 12 ? reqMonth : undefined;
    const year = !isNaN(reqYear) ? reqYear : now.getFullYear();

    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchPopularMovies(year, month, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar filmes populares." });
  }
}

export async function getNowPlaying(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchNowPlayingMovies(page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar filmes em cartaz." });
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
    const result = await searchMovies(query, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar filmes." });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    const movie = await fetchMovieById(id);
    res.json(movie);
  } catch {
    res.status(500).json({ error: "Erro ao buscar detalhes do filme." });
  }
}
