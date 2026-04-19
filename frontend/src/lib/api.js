const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * @param {string} question
 * @returns {Promise<{ response: string }>}
 */
export async function askQuestion(question) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env and set VITE_API_URL."
    );
  }

  const res = await fetch(`${API_URL}/api/generate-recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}
