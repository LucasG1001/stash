import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { migrate } from "./database/migrate.js";
import { animeRoutes } from "./routes/animeRoutes.js";
import { libraryRoutes } from "./routes/libraryRoutes.js";
import { movieRoutes } from "./routes/movieRoutes.js";
import { movieLibraryRoutes } from "./routes/movieLibraryRoutes.js";
import { seriesRoutes } from "./routes/seriesRoutes.js";
import { seriesLibraryRoutes } from "./routes/seriesLibraryRoutes.js";
import { gameRoutes } from "./routes/gameRoutes.js";
import { gameLibraryRoutes } from "./routes/gameLibraryRoutes.js";
import { bookRoutes } from "./routes/bookRoutes.js";
import { bookLibraryRoutes } from "./routes/bookLibraryRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use("/api/anime", animeRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/movie", movieRoutes);
app.use("/api/movie-library", movieLibraryRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/series-library", seriesLibraryRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/game-library", gameLibraryRoutes);
app.use("/api/book", bookRoutes);
app.use("/api/book-library", bookLibraryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  await migrate();
  app.listen(PORT, () => {
    process.stdout.write(`Backend rodando em http://localhost:${PORT}\n`);
  });
}

start();
