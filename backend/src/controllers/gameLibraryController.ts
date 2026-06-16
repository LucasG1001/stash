import { createLibraryController } from "../lib/createLibraryController.js";
import { gameLibraryModel } from "../models/gameLibraryModel.js";
import { gameCreateSchema, gameUpdateSchema } from "../schemas/library.js";
import { notifyGameAdded } from "../services/notifyService.js";

export const { getAll, create, update, remove } = createLibraryController({
  model: gameLibraryModel,
  externalIdField: "igdbId",
  createSchema: gameCreateSchema,
  updateSchema: gameUpdateSchema,
  onCreated: (entry) => void notifyGameAdded(entry),
  messages: {
    required: "igdbId e title são obrigatórios.",
    invalid: "Dados inválidos.",
    duplicate: "Jogo já está na biblioteca.",
    notFound: "Jogo não encontrado na biblioteca.",
    errorGetAll: "Erro ao buscar biblioteca.",
    errorCreate: "Erro ao adicionar jogo à biblioteca.",
    errorUpdate: "Erro ao atualizar jogo na biblioteca.",
    errorRemove: "Erro ao remover jogo da biblioteca.",
  },
});
