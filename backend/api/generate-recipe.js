import "dotenv/config";
import { connectDB } from "../config/database.js";
import { Recipe } from "../models/Recipe.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_TIMEOUT_MS = 10000;

const SYSTEM_PROMPT = `You are a professional Italian chef.

Given exactly 3 ingredients, you MUST use ALL 3 ingredients in the recipe.

STRICT RULES:
- All 3 ingredients MUST appear in the ingredientsList
- All 3 ingredients MUST be used in the instructions
- Do NOT ignore any ingredient
- Do NOT substitute ingredients
- Do NOT skip ingredients even if unusual

- Return ONLY valid JSON
- No explanation
- No markdown

Format:
{
  "recipeName": "string",
  "prepTime": "string",
  "ingredientsList": ["string"],
  "instructions": ["string"]
}`;

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

function sendJSON(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function getRequestBody(req) {
  if (typeof req.body !== "string") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch {
    return null;
  }
}

function validateIngredients(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { isValid: false, error: 'Request body must include "ingredients".' };
  }

  if (!Array.isArray(body.ingredients) || body.ingredients.length !== 3) {
    return { isValid: false, error: "Exactly 3 ingredients are required." };
  }

  const ingredients = body.ingredients.map((ingredient) =>
    typeof ingredient === "string" ? ingredient.trim() : ""
  );

  if (ingredients.some((ingredient) => ingredient.length === 0)) {
    return { isValid: false, error: "Each ingredient must be a non-empty string." };
  }

  return { isValid: true, ingredients };
}

function cleanAIResponse(responseText) {
  return responseText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseRecipe(responseText) {
  console.log("Raw Groq:", responseText);
  let parsed;
  try {
    parsed = JSON.parse(cleanAIResponse(responseText));
  } catch (e) {
    throw Object.assign(new Error("Invalid AI response format"), { raw: responseText });
  }
  return parsed;
}

function normalizeRecipe(payload) {
  const recipeName = typeof payload?.recipeName === "string" ? payload.recipeName.trim() : "";
  const prepTime = typeof payload?.prepTime === "string" ? payload.prepTime.trim() : "";
  const ingredientsList = Array.isArray(payload?.ingredientsList)
    ? payload.ingredientsList
        .map((ingredient) => (typeof ingredient === "string" ? ingredient.trim() : ""))
        .filter(Boolean)
    : [];
  const instructions = Array.isArray(payload?.instructions)
    ? payload.instructions
        .map((instruction) => (typeof instruction === "string" ? instruction.trim() : ""))
        .filter(Boolean)
    : [];

  if (!recipeName || !prepTime || ingredientsList.length === 0 || instructions.length === 0) {
    throw new Error("AI response is missing required recipe fields.");
  }

  return { recipeName, prepTime, ingredientsList, instructions };
}

async function callGroq(ingredients) {
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
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Ingredients: ${ingredients.join(", ")}` },
        ],
        temperature: 0.4,
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

    return normalizeRecipe(parseRecipe(content));
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Groq API request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const validation = validateIngredients(getRequestBody(req));
  if (!validation.isValid) {
    return sendJSON(res, 400, { error: validation.error });
  }

  try {
    await ensureDB();

    let recipe;
    try {
      recipe = await callGroq(validation.ingredients);
    } catch (groqError) {
      console.error("Groq failed, using fallback:", groqError.message);
      if (groqError.raw) console.error("Raw response:", groqError.raw);
      recipe = {
        recipeName: "Simple Mix",
        prepTime: "15 minutes",
        ingredientsList: validation.ingredients,
        instructions: [
          `Prepare your ingredients: ${validation.ingredients.join(", ")}.`,
          "Combine them together using your preferred cooking method.",
          "Season to taste and serve.",
        ],
      };
    }

    await Recipe.create({
      ingredients: validation.ingredients,
      ...recipe,
    }).catch((dbErr) => console.error("DB save failed:", dbErr.message));

    return sendJSON(res, 200, recipe);
  } catch (error) {
    console.error("Recipe generation failed:", error.message);
    return sendJSON(res, 500, { error: "Failed to generate recipe." });
  }
}
