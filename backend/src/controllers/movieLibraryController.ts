import { createLibraryController } from "../lib/createLibraryController.js";
import { movieLibraryModel } from "../models/movieLibraryModel.js";
import { movieCreateSchema, movieUpdateSchema } from "../schemas/library.js";
import { notifyMovieAdded } from "../services/notifyService.js";

export const { getAll, create, update, remove } = createLibraryController({
  model: movieLibraryModel,
  externalIdField: "tmdbId",
  createSchema: movieCreateSchema,
  updateSchema: movieUpdateSchema,
  onCreated: (entry) => void notifyMovieAdded(entry),
  messages: {
    required: "tmdbId e title são obrigatórios.",
    invalid: "Dados inválidos.",
    duplicate: "Filme já está na biblioteca.",
    notFound: "Filme não encontrado na biblioteca.",
    errorGetAll: "Erro ao buscar biblioteca.",
    errorCreate: "Erro ao adicionar filme à biblioteca.",
    errorUpdate: "Erro ao atualizar filme na biblioteca.",
    errorRemove: "Erro ao remover filme da biblioteca.",
  },
});
