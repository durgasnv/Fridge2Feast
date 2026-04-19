const API_BASE = import.meta.env.VITE_API_BASE ?? "";

/**
 * @param {string[]} ingredients
 */
export async function generateRecipe(ingredients) {
  const res = await fetch(`${API_BASE}/api/generate-recipe`, {
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
