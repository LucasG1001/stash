import type { Request, Response } from "express";
import { fetchBooksByGenre, searchBooks, fetchBookById } from "../services/googleBooksService.js";
import { notifyError } from "../services/notifyService.js";

export async function getByGenre(req: Request, res: Response): Promise<void> {
  try {
    const genre = String(req.query.genre || "Fiction");
    const page = parseInt(String(req.query.page || "1")) || 1;
    const result = await fetchBooksByGenre(genre, page);
    res.json(result);
  } catch (error) {
    void notifyError("API book/list", error);
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
  } catch (error) {
    void notifyError("API book/list", error);
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
  } catch (error) {
    void notifyError("API book/:id", error);
    res.status(500).json({ error: "Erro ao buscar detalhes do livro." });
  }
}
