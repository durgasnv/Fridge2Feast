import { useState } from "react";
import { askQuestion } from "../lib/api.js";

export function HomePage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await askQuestion(q);
      setResponse(data.response);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center px-5 py-14 sm:px-8 sm:py-20">

      {/* Header */}
      <header className="mb-12 w-full text-center">
        <div className="mb-5 flex items-center justify-center gap-3 text-2xl sm:text-3xl" aria-hidden="true">
          <span>🍝</span>
          <span>🍅</span>
          <span>🧄</span>
        </div>
        <p className="font-serif text-sm font-semibold uppercase tracking-[0.35em] text-wine/80">
          Fridge2Feast
        </p>
        <h1 className="font-serif mt-4 text-[2.1rem] font-semibold leading-[1.15] text-wine sm:text-4xl">
          Ask your chef
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-olive/75">
          Ask any cooking question or list your ingredients — get an instant recipe.
        </p>
      </header>

      {/* Question form */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="rounded-menu border border-wine/15 bg-cream-soft/90 p-6 shadow-lift sm:p-8">
          <label className="block font-serif text-center text-lg font-semibold text-wine mb-4">
            What's your question?
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What can I make with tomato, garlic and pasta?"
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-menu border border-olive/30 bg-cream px-4 py-3 text-sm text-olive placeholder:italic placeholder:text-olive/40 focus:border-olive focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="font-serif mt-5 w-full rounded-menu border border-wine-dark/30 bg-wine px-6 py-3.5 text-lg font-semibold tracking-wide text-cream shadow-[0_3px_0_rgba(60,30,20,0.25)] transition hover:bg-wine-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? "In cucina…" : "Ask"}
          </button>
        </div>
      </form>

      {/* Response */}
      {(response || error) && (
        <div className="mt-10 w-full">
          {error && (
            <div className="rounded-menu border-2 border-wine/40 bg-cream-soft p-6 text-center shadow-menu" role="alert">
              <p className="font-serif text-lg font-semibold text-wine">Non siamo riusciti</p>
              <p className="mt-2 text-sm text-olive/90">{error}</p>
            </div>
          )}

          {response && (
            <article className="rounded-menu border-[3px] border-double border-wine/85 bg-cream-soft shadow-menu overflow-hidden">
              <div className="border-b border-wine/20 bg-gradient-to-b from-cream-deep/90 to-cream-soft px-8 py-5 text-center">
                <p className="font-serif text-xs font-semibold uppercase tracking-[0.4em] text-olive/75">
                  La risposta
                </p>
              </div>
              <div className="px-8 py-7">
                <p className="font-sans text-sm leading-relaxed text-olive whitespace-pre-wrap">
                  {response}
                </p>
              </div>
              <footer className="flex justify-center border-t border-wine/10 bg-cream-deep/30 px-6 py-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-wine/25 to-transparent" />
              </footer>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
