import { useState } from "react";
import { IngredientForm } from "../components/IngredientForm.jsx";
import { RecipeCard } from "../components/RecipeCard.jsx";
import { generateRecipe } from "../lib/api.js";

export function HomePage() {
  const [values, setValues] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(index, value) {
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    setRecipe(null);
    const trimmed = values.map((v) => v.trim());
    if (trimmed.some((v) => !v)) {
      setError("Per favore—three ingredients, each one filled in.");
      return;
    }
    setLoading(true);
    try {
      const data = await generateRecipe(trimmed);
      setRecipe(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-5 py-14 sm:px-8 sm:py-20">
      <header className="mb-12 w-full text-center">
        <div
          className="mb-5 flex items-center justify-center gap-3 text-2xl sm:text-3xl"
          aria-hidden="true"
        >
          <span className="select-none" title="pasta">
            🍝
          </span>
          <span className="select-none" title="tomato">
            🍅
          </span>
          <span className="select-none" title="garlic">
            🧄
          </span>
        </div>
        <p className="font-serif text-sm font-semibold uppercase tracking-[0.35em] text-wine/80">
          Fridge2Feast
        </p>
        <h1 className="font-serif mt-4 text-[2.1rem] font-semibold leading-[1.15] text-wine sm:text-4xl">
          Tre ingredienti,
          <br />
          <span className="italic text-olive">una ricetta</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-pretty text-[0.95rem] leading-relaxed text-olive/85">
          Hand your pantry three stars—we’ll answer with a dish worthy of the
          table. Saved quietly, served with care.
        </p>
      </header>

      <div className="flex w-full flex-col items-center gap-12">
        <IngredientForm
          values={values}
          onChange={handleChange}
          onSubmit={handleSubmit}
          disabled={loading}
        />
        <RecipeCard
          recipeName={recipe?.recipeName}
          prepTime={recipe?.prepTime}
          ingredientsList={recipe?.ingredientsList}
          instructions={recipe?.instructions}
          error={error}
        />
      </div>
    </div>
  );
}
