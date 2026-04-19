/**
 * @param {{
 *   values: [string, string, string];
 *   onChange: (index: 0 | 1 | 2, value: string) => void;
 *   onSubmit: () => void;
 *   disabled?: boolean;
 * }} props
 */
export function IngredientForm({ values, onChange, onSubmit, disabled }) {
  const labels = ["First ingredient", "Second ingredient", "Third ingredient"];

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md"
    >
      <div className="space-y-4">
        {labels.map((label, i) => (
          <label key={label} className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">
              {label}
            </span>
            <input
              type="text"
              name={`ingredient${i + 1}`}
              value={values[i]}
              onChange={(e) => onChange(i, e.target.value)}
              autoComplete="off"
              placeholder="e.g. chicken thigh"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none ring-emerald-400/0 transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/30"
              disabled={disabled}
              required
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Generating…" : "Generate recipe"}
      </button>
    </form>
  );
}
