import { RecipeCard } from "./RecipeCard.jsx";

/**
 * @param {{
 *   role: "user" | "assistant";
 *   content: string | null;
 *   recipe: object | null;
 * }} props
 */
export function ChatMessage({ role, content, recipe }) {
  const isUser = role === "user";

  return (
    <div className={`mb-5 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "max-w-[75%]" : "w-full max-w-[92%]"}`}>
        {content && (
          <div
            className={`rounded-menu px-4 py-3 text-sm leading-relaxed shadow-tag
              ${isUser
                ? "bg-wine text-cream"
                : "border border-wine/15 bg-cream-soft text-olive"
              }`}
          >
            {content}
          </div>
        )}
        {recipe && (
          <div className="mt-3">
            <RecipeCard
              recipeName={recipe.recipeName}
              prepTime={recipe.prepTime}
              ingredientsList={recipe.ingredientsList}
              instructions={recipe.instructions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
