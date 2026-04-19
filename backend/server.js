import "dotenv/config";
import cors from "cors";
import express from "express";
import serverless from "serverless-http";
import { connectDB } from "./config/database.js";
import recipeRouter from "./routes/recipe.js";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();

// --- middleware
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// --- routes
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "fridge2feast-api" });
});

app.use("/api", recipeRouter);

// --- error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// --- DB (important: connect once)
let isConnected = false;
async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// --- export for Vercel
export default async function handler(req, res) {
  await ensureDB();

  // manually parse body (Vercel safe)
  if (req.method === "POST") {
    let body = "";

    await new Promise((resolve) => {
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch (err) {
          req.body = {};
        }
        resolve();
      });
    });
  }

  return serverless(app)(req, res);
}
