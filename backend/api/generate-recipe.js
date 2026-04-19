import "dotenv/config";
import { connectDB } from "../config/database.js";
import { Query } from "../models/Query.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `You are a knowledgeable cooking assistant.
Answer the user's cooking question clearly and concisely.
If they list ingredients, suggest a recipe with a name, prep time, ingredients, and step-by-step instructions.
Keep responses helpful and to the point.`;

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

async function callGroq(question) {
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
          { role: "user", content: question },
        ],
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

    return content;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Request timed out.");
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
  const question = body?.question?.trim();

  if (!question) {
    return res.status(400).json({ error: "question is required." });
  }

  try {
    await ensureDB();

    let response;
    try {
      response = await callGroq(question);
    } catch (groqError) {
      console.error("Groq failed:", groqError.message);
      return res.status(500).json({ error: "Failed to get a response. Please try again." });
    }

    await Query.create({ question, response }).catch((err) =>
      console.error("DB save failed:", err.message)
    );

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Handler failed:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
