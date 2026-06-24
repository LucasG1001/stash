import type { Request, Response, NextFunction } from "express";
import { notifyError } from "../services/notifyService.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Rota não encontrada." });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  void notifyError(`API ${req.method} ${req.path}`, err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Erro interno do servidor." });
}
