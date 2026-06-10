import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { migrate } from "./database/migrate.js";
import { animeRoutes } from "./routes/animeRoutes.js";
import { libraryRoutes } from "./routes/libraryRoutes.js";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use("/api/anime", animeRoutes);
app.use("/api/library", libraryRoutes);

async function start(): Promise<void> {
  await migrate();
  app.listen(PORT, () => {
    process.stdout.write(`Backend rodando em http://localhost:${PORT}\n`);
  });
}

start();
