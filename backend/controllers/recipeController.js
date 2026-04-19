import { Recipe } from "../models/Recipe.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

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

function validateIngredients(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      isValid: false,
      error: 'Request body must be a JSON object with an "ingredients" array.',
    };
  }

  if (!Array.isArray(body.ingredients) || body.ingredients.length !== 3) {
    return {
      isValid: false,
      error: "Exactly 3 ingredients are required.",
    };
  }

  const ingredients = body.ingredients.map((ingredient) =>
    typeof ingredient === "string" ? ingredient.trim() : ""
  );

  if (ingredients.some((ingredient) => ingredient.length === 0)) {
    return {
      isValid: false,
      error: "Each ingredient must be a non-empty string.",
    };
  }

  return { isValid: true, ingredients };
}

async function requestGroqRecipe(ingredients) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("GROQ_API_KEY is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Ingredients: ${ingredients.join(", ")}`,
        },
      ],
      temperature: 0.4,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message || `Groq API request failed with status ${response.status}.`;
    const error = new Error(message);
    error.statusCode = response.status >= 500 ? 502 : response.status;
    throw error;
  }

  const aiResponse = data?.choices?.[0]?.message?.content;
  if (typeof aiResponse !== "string" || !aiResponse.trim()) {
    const error = new Error("Groq API returned an empty response.");
    error.statusCode = 502;
    throw error;
  }

  return aiResponse;
}

function cleanAIResponse(responseText) {
  return responseText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseRecipeJSON(responseText) {
  const cleanedResponse = cleanAIResponse(responseText);

  try {
    return JSON.parse(cleanedResponse);
  } catch {
    console.error("Raw AI response:", responseText);
    const error = new Error("Invalid AI response format");
    error.statusCode = 502;
    throw error;
  }
}

function normalizeRecipePayload(payload) {
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
    const error = new Error("AI response is missing required recipe fields.");
    error.statusCode = 502;
    throw error;
  }

  return {
    recipeName,
    prepTime,
    ingredientsList,
    instructions,
  };
}

export async function generateRecipe(req, res) {
  try {
    const validation = validateIngredients(req.body);

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const rawAIResponse = await requestGroqRecipe(validation.ingredients);
    const parsedRecipe = parseRecipeJSON(rawAIResponse);
    const recipeData = normalizeRecipePayload(parsedRecipe);

    const recipe = await Recipe.create({
      ingredients: validation.ingredients,
      ...recipeData,
    });

    return res.status(201).json({
      id: recipe._id,
      recipeName: recipe.recipeName,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients,
      ingredientsList: recipe.ingredientsList,
      instructions: recipe.instructions,
      createdAt: recipe.createdAt,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to generate recipe.",
    });
  }
}
