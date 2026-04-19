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
      <div
        className="w-full rounded-menu border-2 border-wine/40 bg-cream-soft p-8 text-center shadow-menu"
        role="alert"
      >
        <p className="font-serif text-xl font-semibold text-wine">
          Non siamo riusciti
        </p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-olive/90">
          {error}
        </p>
      </div>
    );
  }

  if (!recipeName && !instructions) {
    return (
      <div className="w-full rounded-menu border border-dashed border-olive/25 bg-cream-soft/50 px-8 py-14 text-center shadow-inner">
        <p className="font-serif text-xl italic text-olive/55">
          Your menu awaits
        </p>
        <p className="mt-3 font-sans text-sm text-olive/65">
          Add three ingredients above—the recipe will appear here, lettered like
          a trattoria card.
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
    <article
      className="animate-recipe-enter w-full overflow-hidden rounded-menu border-[3px] border-double border-wine/85 bg-cream-soft shadow-menu"
    >
      <div className="border-b-2 border-wine/20 bg-gradient-to-b from-cream-deep/90 to-cream-soft px-8 pb-7 pt-8 text-center">
        <p className="font-serif text-xs font-semibold uppercase tracking-[0.4em] text-olive/75">
          La ricetta
        </p>
        <h2 className="font-serif mt-3 text-[1.75rem] font-semibold leading-tight text-wine sm:text-[2rem]">
          {recipeName}
        </h2>
        {prepTime && (
          <p className="mt-4 inline-block border-t border-wine/15 pt-4 font-sans text-sm italic text-olive/85">
            Tempo · {prepTime}
          </p>
        )}
      </div>

      <div className="space-y-8 px-8 py-8">
        {ingredientsList && ingredientsList.length > 0 && (
          <section>
            <h3 className="text-center font-serif text-sm font-semibold uppercase tracking-[0.25em] text-wine">
              Ingredienti
            </h3>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {ingredientsList.map((ing) => (
                <li
                  key={ing}
                  className="rounded-full border border-olive/25 bg-cream px-3 py-1.5 font-sans text-sm text-olive shadow-tag"
                >
                  {ing}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-center font-serif text-sm font-semibold uppercase tracking-[0.25em] text-wine">
            Preparazione
          </h3>
          <ol className="mt-5 space-y-4 border-t border-wine/10 pt-5 font-sans text-[0.95rem] leading-relaxed text-olive">
            {steps.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span
                  className="font-serif text-lg font-semibold text-wine/90 tabular-nums"
                  aria-hidden
                >
                  {idx + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="flex justify-center border-t border-wine/10 bg-cream-deep/30 px-6 py-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-wine/25 to-transparent" />
      </footer>
    </article>
  );
}
