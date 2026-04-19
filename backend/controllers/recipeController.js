import { Recipe } from "../models/Recipe.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT =
  "You are a professional Italian chef. Given exactly 3 ingredients, generate exactly ONE Italian-style recipe.\n\n" +
  "Return ONLY valid JSON. No explanation.\n\n" +
  "Format:\n" +
  "{\n" +
  '  "recipeName": "",\n' +
  '  "prepTime": "",\n' +
  '  "ingredientsList": [],\n' +
  '  "instructions": []\n' +
  "}";

/**
 * @param {unknown} body
 * @returns {{ ok: true, ingredients: string[] } | { ok: false, message: string }}
 */
function validateIngredientsBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: 'Request body must be a JSON object with "ingredients".' };
  }

  const { ingredients } = body;
  if (!Array.isArray(ingredients)) {
    return { ok: false, message: 'Request body must include an "ingredients" array.' };
  }

  if (ingredients.length !== 3) {
    return { ok: false, message: "Exactly 3 ingredients are required." };
  }

  const normalized = ingredients.map((item) => String(item).trim()).filter(Boolean);
  if (normalized.length !== 3) {
    return { ok: false, message: "Each ingredient must be a non-empty string." };
  }

  return { ok: true, ingredients: normalized };
}

/**
 * @param {string} text
 * @returns {Record<string, unknown> | null}
 */
function parseJsonObjectSafely(text) {
  if (typeof text !== "string" || !text.trim()) return null;

  const trimmed = text.trim();

  const tryParse = (candidate) => {
    try {
      const parsed = JSON.parse(candidate);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");
      if (start === -1 || end <= start) return null;
      try {
        const parsed = JSON.parse(candidate.slice(start, end + 1));
        return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
          ? parsed
          : null;
      } catch {
        return null;
      }
    }
  };

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    const fromFence = tryParse(fence[1].trim());
    if (fromFence) return fromFence;
  }

  return tryParse(trimmed);
}

/**
 * @param {Record<string, unknown>} obj
 * @returns {{ recipeName: string; prepTime: string; ingredientsList: string[]; instructions: string[] } | null}
 */
function mapGroqRecipePayload(obj) {
  const recipeName = String(obj.recipeName ?? "").trim();
  const prepTime = String(obj.prepTime ?? "").trim();
  const rawList = obj.ingredientsList;
  const ingredientsList = Array.isArray(rawList)
    ? rawList.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const rawInstr = obj.instructions;
  const instructions = Array.isArray(rawInstr)
    ? rawInstr.map((step) => String(step).trim()).filter(Boolean)
    : [];

  if (!recipeName || !prepTime || ingredientsList.length === 0 || instructions.length === 0) {
    return null;
  }

  return { recipeName, prepTime, ingredientsList, instructions };
}

/**
 * @param {string[]} ingredients
 */
async function callGroq(ingredients) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not set");
    err.code = "GROQ_NOT_CONFIGURED";
    throw err;
  }

  const userPrompt = `Ingredients: ${ingredients.join(", ")}`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
    }),
  });

  const rawBody = await res.text();
  if (!res.ok) {
    const err = new Error(`Groq API returned ${res.status}`);
    err.code = "GROQ_HTTP_ERROR";
    err.status = res.status;
    err.details = rawBody.slice(0, 500);
    throw err;
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    const err = new Error("Invalid JSON from Groq API");
    err.code = "GROQ_INVALID_RESPONSE";
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  const raw = typeof content === "string" ? content.trim() : "";
  if (!raw) {
    const err = new Error("Empty content from Groq API");
    err.code = "GROQ_EMPTY_CONTENT";
    throw err;
  }

  return raw;
}

export async function generateRecipe(req, res, next) {
  try {
    const validation = validateIngredientsBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.message });
    }

    const { ingredients } = validation;

    let groqText;
    try {
      groqText = await callGroq(ingredients);
    } catch (e) {
      if (e.code === "GROQ_NOT_CONFIGURED") {
        return res.status(503).json({ error: "Groq API is not configured (missing GROQ_API_KEY)." });
      }
      if (e.code === "GROQ_HTTP_ERROR") {
        console.error("[recipe] Groq HTTP error:", e.status, e.details);
        return res.status(502).json({ error: "Groq API request failed." });
      }
      if (
        e.code === "GROQ_INVALID_RESPONSE" ||
        e.code === "GROQ_EMPTY_CONTENT"
      ) {
        console.error("[recipe] Groq response error:", e.message);
        return res.status(502).json({ error: "Unexpected response from Groq API." });
      }
      throw e;
    }

    const parsed = parseJsonObjectSafely(groqText);
    if (!parsed) {
      console.error("[recipe] JSON parse failed. Snippet:", groqText.slice(0, 400));
      return res.status(422).json({
        error: "Could not parse recipe JSON from model output.",
      });
    }

    const mapped = mapGroqRecipePayload(parsed);
    if (!mapped) {
      return res.status(422).json({
        error:
          "Recipe JSON was missing required fields or had invalid shape. Expected recipeName, prepTime, ingredientsList (non-empty array), instructions (non-empty array of strings).",
      });
    }

    const doc = await Recipe.create({
      ingredients,
      recipeName: mapped.recipeName,
      prepTime: mapped.prepTime,
      ingredientsList: mapped.ingredientsList,
      instructions: mapped.instructions,
    });

    return res.status(201).json({
      id: doc._id,
      recipeName: doc.recipeName,
      prepTime: doc.prepTime,
      ingredients,
      ingredientsList: doc.ingredientsList,
      instructions: doc.instructions,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    next(err);
  }
}
