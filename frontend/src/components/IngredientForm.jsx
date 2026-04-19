/**
 * @param {{
 *   values: [string, string, string];
 *   onChange: (index: 0 | 1 | 2, value: string) => void;
 *   onSubmit: () => void;
 *   disabled?: boolean;
 * }} props
 */
export function IngredientForm({ values, onChange, onSubmit, disabled }) {
  const hints = [
    { n: "I", ph: "es. pomodori" },
    { n: "II", ph: "es. basilico" },
    { n: "III", ph: "es. aglio" },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-menu border border-wine/15 bg-cream-soft/90 p-7 shadow-lift sm:p-8"
    >
      <p className="font-serif text-center text-lg font-semibold text-wine">
        La dispensa
      </p>
      <p className="mt-1 text-center text-sm text-olive/75">
        Three tags—what do you have today?
      </p>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
        {hints.map(({ n, ph }, i) => (
          <label
            key={n}
            className="group flex w-full max-w-[220px] flex-col items-center sm:max-w-[200px]"
          >
            <span className="mb-2 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-olive/70">
              {n}
            </span>
            <div
              className="relative w-full rounded-full border-2 border-olive/35 bg-cream px-4 py-2.5 shadow-tag transition-colors group-focus-within:border-olive group-focus-within:bg-cream-deep/80"
            >
              <input
                type="text"
                name={`ingredient${i + 1}`}
                value={values[i]}
                onChange={(e) => onChange(i, e.target.value)}
                autoComplete="off"
                placeholder={ph}
                className="w-full bg-transparent text-center font-sans text-sm text-olive placeholder:text-olive/40 placeholder:italic focus:outline-none disabled:opacity-60"
                disabled={disabled}
                required
              />
            </div>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="font-serif mt-10 w-full rounded-menu border border-wine-dark/30 bg-wine px-6 py-3.5 text-lg font-semibold tracking-wide text-cream shadow-[0_3px_0_rgba(60,30,20,0.25)] transition hover:bg-wine-dark hover:text-cream active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
      >
        {disabled ? "In cucina…" : "Create Recipe"}
      </button>
    </form>
  );
}
