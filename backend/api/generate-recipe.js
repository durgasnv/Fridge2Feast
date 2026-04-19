import "dotenv/config";
import { connectDB } from "../config/database.js";
import { Recipe } from "../models/Recipe.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `You are Cucina, a warm and knowledgeable Italian cooking assistant.

When the user asks you to generate a recipe, mentions ingredients they want to cook with, or asks you to modify an existing recipe, respond with ONLY this JSON (no markdown, no extra text):
{"type":"recipe","recipeName":"string","prepTime":"string","ingredientsList":["string"],"instructions":["string"]}

For all other messages — cooking tips, questions, general conversation — respond in plain conversational text. Keep responses concise and warm.

Rules:
- If the user says "make it spicier", "make it vegetarian", "use less oil" etc. — return a full updated recipe JSON
- Never mix JSON and plain text in the same response`;

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

function parseGroqResponse(content) {
  console.log("Raw Groq:", content);
  const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.type === "recipe") {
      return { recipe: parsed, reply: null };
    }
  } catch {
    // not JSON — treat as plain text
  }
  return { recipe: null, reply: content };
}

async function callGroq(messages) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.5,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error?.message || "Groq API request failed.");
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Groq API returned an empty response.");
    }

    return parseGroqResponse(content);
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Groq API request timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const messages = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  try {
    await ensureDB();

    let result;
    try {
      result = await callGroq(messages);
    } catch (groqError) {
      console.error("Groq failed:", groqError.message);
      return res.status(200).json({
        reply: "Sorry, I'm having trouble right now. Please try again.",
        recipe: null,
      });
    }

    if (result.recipe) {
      await Recipe.create({
        ingredients: result.recipe.ingredientsList || [],
        recipeName: result.recipe.recipeName,
        prepTime: result.recipe.prepTime,
        ingredientsList: result.recipe.ingredientsList,
        instructions: result.recipe.instructions,
      }).catch((err) => console.error("DB save failed:", err.message));
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Handler failed:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
