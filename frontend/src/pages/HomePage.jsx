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
      setError("Please fill in all three ingredients.");
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
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="text-sm font-medium text-emerald-400/90">Fridge2Feast</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Turn three ingredients into a meal
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-slate-400">
          Enter exactly three ingredients. We will generate a recipe and save it
          to your database.
        </p>
      </header>

      <div className="grid flex-1 gap-8 lg:grid-cols-2 lg:items-start">
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
