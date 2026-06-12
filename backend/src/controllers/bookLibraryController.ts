import { createLibraryController } from "../lib/createLibraryController.js";
import { bookLibraryModel } from "../models/bookLibraryModel.js";
import { bookCreateSchema, bookUpdateSchema } from "../schemas/library.js";

export const { getAll, create, update, remove } = createLibraryController({
  model: bookLibraryModel,
  externalIdField: "googleBooksId",
  createSchema: bookCreateSchema,
  updateSchema: bookUpdateSchema,
  messages: {
    required: "googleBooksId e title são obrigatórios.",
    invalid: "Dados inválidos.",
    duplicate: "Livro já está na biblioteca.",
    notFound: "Livro não encontrado na biblioteca.",
    errorGetAll: "Erro ao buscar biblioteca.",
    errorCreate: "Erro ao adicionar livro à biblioteca.",
    errorUpdate: "Erro ao atualizar livro na biblioteca.",
    errorRemove: "Erro ao remover livro da biblioteca.",
  },
});
