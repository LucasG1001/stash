import { createLibraryController } from "../lib/createLibraryController.js";
import { seriesLibraryModel } from "../models/seriesLibraryModel.js";
import { seriesCreateSchema, seriesUpdateSchema } from "../schemas/library.js";

export const { getAll, create, update, remove, removeMany } = createLibraryController({
  model: seriesLibraryModel,
  externalIdField: "tmdbId",
  createSchema: seriesCreateSchema,
  updateSchema: seriesUpdateSchema,
  messages: {
    required: "tmdbId e title são obrigatórios.",
    invalid: "Dados inválidos.",
    duplicate: "Série já está na biblioteca.",
    notFound: "Série não encontrada na biblioteca.",
    errorGetAll: "Erro ao buscar biblioteca.",
    errorCreate: "Erro ao adicionar série à biblioteca.",
    errorUpdate: "Erro ao atualizar série na biblioteca.",
    errorRemove: "Erro ao remover série da biblioteca.",
  },
});
