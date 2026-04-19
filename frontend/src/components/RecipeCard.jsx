/**
 * @param {{
 *   recipeName?: string;
 *   prepTime?: string;
 *   ingredientsList?: string[];
 *   instructions?: string[] | string;
 *   error?: string | null;
 * }} props
 */
export function RecipeCard({
  recipeName,
  prepTime,
  ingredientsList,
  instructions,
  error,
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-6 text-rose-100 shadow-card backdrop-blur-md">
        <h2 className="font-display text-lg font-semibold text-rose-50">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-rose-200/90">{error}</p>
      </div>
    );
  }

  if (!recipeName && !instructions) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-slate-400">
        <p className="text-sm">
          Your recipe will appear here after you submit three ingredients.
        </p>
      </div>
    );
  }

  const steps = Array.isArray(instructions)
    ? instructions
    : instructions
      ? String(instructions)
          .split(/\n+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950/90 shadow-card backdrop-blur-md">
      <div className="border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-300/90">
          Your recipe
        </p>
        <h2 className="font-display mt-1 text-2xl font-semibold leading-tight text-white">
          {recipeName}
        </h2>
        {prepTime && (
          <p className="mt-2 text-sm text-slate-400">
            Prep time: <span className="text-slate-200">{prepTime}</span>
          </p>
        )}
      </div>
      <div className="space-y-5 px-6 py-6">
        {ingredientsList && ingredientsList.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ingredients
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {ingredientsList.map((ing) => (
                <li
                  key={ing}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200"
                >
                  {ing}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Instructions
          </h3>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-200">
            {steps.map((step, idx) => (
              <li key={idx} className="marker:text-emerald-400/90">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}
