import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../components/ChatMessage.jsx";
import { chat } from "../lib/api.js";

const STARTERS = [
  "Make pasta with tomato and garlic",
  "I have eggs, cheese, and spinach",
  "What can I make with chicken and lemon?",
];

export function HomePage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg = { role: "user", content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      // Send only role + content to backend (recipe content stored as JSON string for context)
      const apiMessages = history.map(({ role, content }) => ({ role, content }));
      const data = await chat(apiMessages);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          // Store JSON string as content so follow-up turns have recipe context
          content: data.recipe ? JSON.stringify(data.recipe) : (data.reply ?? null),
          recipe: data.recipe ?? null,
          // Display text separately from stored content
          displayContent: data.reply ?? null,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e.message || "Something went wrong. Please try again.",
          recipe: null,
          displayContent: e.message || "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-2xl flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-wine/15 bg-cream-soft/90 px-6 py-4 text-center backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-lg" aria-hidden="true">
          <span>🍝</span>
          <span>🍅</span>
          <span>🧄</span>
        </div>
        <p className="font-serif mt-1 text-xs font-semibold uppercase tracking-[0.35em] text-wine/80">
          Fridge2Feast
        </p>
        <p className="font-serif text-sm italic text-olive/60">
          Il tuo chef personale
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
            <div>
              <p className="font-serif text-2xl font-semibold text-wine">
                Cosa c'è in frigo?
              </p>
              <p className="mt-2 text-sm text-olive/70">
                Tell me what ingredients you have — I'll create a recipe.
                <br />
                You can follow up to refine it anytime.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-wine/25 bg-cream px-4 py-2 text-sm text-olive shadow-tag transition hover:border-wine/50 hover:bg-cream-deep"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.displayContent !== undefined ? msg.displayContent : msg.content}
            recipe={msg.recipe}
          />
        ))}

        {loading && (
          <div className="mb-5 flex justify-start">
            <div className="rounded-menu border border-wine/15 bg-cream-soft px-4 py-3 shadow-tag">
              <span className="font-serif text-sm italic text-olive/60">
                In cucina…
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-wine/15 bg-cream-soft/90 p-4 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what's in your fridge…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-menu border border-olive/30 bg-cream px-4 py-3 text-sm text-olive placeholder:italic placeholder:text-olive/40 focus:border-olive focus:outline-none disabled:opacity-60"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="font-serif rounded-menu border border-wine-dark/30 bg-wine px-5 py-3 text-sm font-semibold text-cream shadow-[0_3px_0_rgba(60,30,20,0.25)] transition hover:bg-wine-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
          >
            Invia
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-olive/40">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
