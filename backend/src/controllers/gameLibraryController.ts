import { createLibraryController } from "../lib/createLibraryController.js";
import { gameLibraryModel } from "../models/gameLibraryModel.js";
import { gameCreateSchema, gameUpdateSchema } from "../schemas/library.js";

export const { getAll, create, update, remove } = createLibraryController({
  model: gameLibraryModel,
  externalIdField: "rawgId",
  createSchema: gameCreateSchema,
  updateSchema: gameUpdateSchema,
  messages: {
    required: "rawgId e title são obrigatórios.",
    invalid: "Dados inválidos.",
    duplicate: "Jogo já está na biblioteca.",
    notFound: "Jogo não encontrado na biblioteca.",
    errorGetAll: "Erro ao buscar biblioteca.",
    errorCreate: "Erro ao adicionar jogo à biblioteca.",
    errorUpdate: "Erro ao atualizar jogo na biblioteca.",
    errorRemove: "Erro ao remover jogo da biblioteca.",
  },
});
