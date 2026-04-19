import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/database.js";
import { recipeRouter } from "./routes/recipeRoutes.js";

const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "fridge2feast-api" });
});

app.use("/", recipeRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
