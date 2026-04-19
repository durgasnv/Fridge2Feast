const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * @param {string[]} ingredients
 */
export async function generateRecipe(ingredients) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env and set VITE_API_URL."
    );
  }

  const res = await fetch(`${API_URL}/api/generate-recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
