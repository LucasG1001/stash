import type { Request, Response } from "express";
import axios from "axios";
import { fetchBooksByGenre, searchBooks, fetchBookById } from "../services/googleBooksService.js";

const ALLOWED_MEDIA_HOSTS = [".google.com", ".googleusercontent.com"];

function isAllowedMediaHost(hostname: string): boolean {
  return ALLOWED_MEDIA_HOSTS.some((suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix));
}

export async function proxyMedia(req: Request, res: Response): Promise<void> {
  try {
    const url = String(req.query.url || "");
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      res.status(400).json({ error: "URL inválida." });
      return;
    }

    if (!isAllowedMediaHost(hostname)) {
      res.status(400).json({ error: "Host não permitido." });
      return;
    }

    const range = req.headers.range;
    const upstream = await axios.get(url, {
      responseType: "stream",
      headers: range ? { Range: range } : {},
      validateStatus: () => true,
    });

    res.status(upstream.status);
    const passthrough = ["content-type", "content-length", "content-range", "accept-ranges"];
    for (const header of passthrough) {
      const value = upstream.headers[header];
      if (value) res.setHeader(header, value);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    upstream.data.pipe(res);
  } catch {
    res.status(502).end();
  }
}

export async function getByGenre(req: Request, res: Response): Promise<void> {
  try {
    const genre = String(req.query.genre || "Fiction");
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchBooksByGenre(genre, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar livros." });
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
    const result = await searchBooks(query, page);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao buscar livros." });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    const book = await fetchBookById(id);
    res.json(book);
  } catch {
    res.status(500).json({ error: "Erro ao buscar detalhes do livro." });
  }
}
