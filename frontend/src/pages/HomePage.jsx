import { useState, useEffect, useRef } from "react";
import { askQuestion } from "../lib/api.js";
import { ResponseCard } from "../components/ResponseCard.jsx";

const STARTERS = [
  { icon: "🍝", text: "Pasta with tomato and garlic" },
  { icon: "🥚", text: "I have eggs, cheese and spinach" },
  { icon: "🍗", text: "Chicken with lemon and herbs" },
  { icon: "🍫", text: "Quick dessert with chocolate and milk" },
];

const PLACEHOLDERS = [
  "e.g. What can I make with tomato, garlic and pasta?",
  "e.g. I have eggs, cheese and spinach…",
  "e.g. Quick dessert with chocolate and milk?",
  "e.g. How do I make a classic risotto?",
  "e.g. Give me a vegetarian recipe with lentils",
];

export function HomePage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const responseRef = useRef(null);

  // Rotate placeholder every 3s
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Scroll to response when it arrives
  useEffect(() => {
    if (response || error) {
      setTimeout(() => {
        responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [response, error]);

  // Show toast when response arrives, auto-dismiss after 3s
  useEffect(() => {
    if (!response) return;
    setShowToast(true);
    const id = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(id);
  }, [response]);

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

  function fillStarter(text) {
    setQuestion(text);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center px-5 py-14 sm:px-8 sm:py-20">

      {/* Header */}
      <header className="mb-12 w-full text-center">
        <div className="mb-5 flex items-center justify-center gap-3 text-2xl sm:text-3xl" aria-hidden="true">
          {["🍝", "🍅", "🧄"].map((emoji, i) => (
            <span
              key={emoji}
              className="animate-emoji-pop inline-block"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {emoji}
            </span>
          ))}
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
        {/* Decorative divider */}
        <div className="mx-auto mt-6 flex items-center gap-3 max-w-xs">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wine/25" />
          <span className="text-wine/40 text-xs">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wine/25" />
        </div>
      </header>

      {/* Starter chips */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {STARTERS.map(({ icon, text }) => (
          <button
            key={text}
            type="button"
            onClick={() => fillStarter(text)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-wine/25 bg-cream px-4 py-2 text-sm text-olive shadow-tag transition hover:border-wine/50 hover:bg-cream-deep hover:shadow-lift disabled:opacity-50"
          >
            <span>{icon}</span>
            <span>{text}</span>
          </button>
        ))}
      </div>

      {/* Question form */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="rounded-menu border border-wine/15 bg-cream-soft/90 p-6 shadow-lift sm:p-8">
          <label className="block font-serif text-center text-lg font-semibold text-wine mb-4">
            What's your question?
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-menu border border-olive/30 bg-cream px-4 py-3 text-sm text-olive placeholder:italic placeholder:text-olive/40 transition-colors focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/15 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className={`font-serif mt-5 w-full rounded-menu border border-wine-dark/30 bg-wine px-6 py-3.5 text-lg font-semibold tracking-wide text-cream shadow-[0_3px_0_rgba(60,30,20,0.25)] transition hover:bg-wine-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 ${loading ? "btn-shimmer" : ""}`}
          >
            {loading ? "In cucina…" : "Ask"}
          </button>
        </div>
      </form>

      {/* Response */}
      {(response || error) && (
        <div ref={responseRef} className="mt-10 w-full scroll-mt-8">
          {error && (
            <div className="animate-recipe-enter rounded-menu border-2 border-wine/40 bg-cream-soft p-6 text-center shadow-menu" role="alert">
              <p className="font-serif text-lg font-semibold text-wine">Non siamo riusciti</p>
              <p className="mt-2 text-sm text-olive/90">{error}</p>
            </div>
          )}
          {response && <ResponseCard text={response} />}
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="animate-toast-enter fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-wine/20 bg-cream-soft px-5 py-2.5 shadow-menu">
          <p className="font-serif text-sm text-olive">
            ✦ Saved to our kitchen
          </p>
        </div>
      )}
    </div>
  );
}
