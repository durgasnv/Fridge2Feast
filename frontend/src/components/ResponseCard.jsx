import { useState } from "react";

/** Converts **bold** markers inside a string into <strong> spans. */
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const match = part.match(/^\*\*(.+)\*\*$/);
    return match ? (
      <strong key={i} className="font-semibold text-wine/90">
        {match[1]}
      </strong>
    ) : (
      part
    );
  });
}

/**
 * Renders a plain-text Groq response with styled typography:
 * - **Bold lines** → recipe name (Cormorant Garamond, large, wine)
 * - "Label:" lines → section headers (small caps, olive)
 * - "1. step" lines → numbered steps (Lora)
 * - "- item" lines → bullet ingredients (Lora)
 * - Everything else → body text (Lora)
 */
export function ResponseCard({ text }) {
  if (!text) return null;

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const lines = text.split("\n");

  const nodes = lines.map((line, i) => {
    const trimmed = line.trim();

    // **Recipe Name**
    const boldMatch = trimmed.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return (
        <h2
          key={i}
          className="font-serif mt-8 text-[1.6rem] font-semibold leading-tight text-wine first:mt-0"
        >
          {boldMatch[1]}
        </h2>
      );
    }

    // Section labels: "Ingredients:", "Instructions:", "Prep Time:", etc.
    if (trimmed.match(/^[A-Za-z ]+:$/) && trimmed.length < 30) {
      return (
        <p
          key={i}
          className="font-serif mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-wine/70"
        >
          {trimmed}
        </p>
      );
    }

    // "Label: value" on one line (e.g. "Prep Time: 5 minutes")
    const labelValueMatch = trimmed.match(/^([A-Za-z ]+):\s+(.+)$/);
    if (labelValueMatch && labelValueMatch[1].length < 20) {
      return (
        <p key={i} className="font-sans mt-1 text-sm text-olive">
          <span className="font-semibold text-wine/80">{labelValueMatch[1]}:</span>{" "}
          {labelValueMatch[2]}
        </p>
      );
    }

    // Numbered steps: "1. Do this"
    const stepMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (stepMatch) {
      return (
        <li key={i} className="flex gap-3 font-sans text-sm leading-relaxed text-olive">
          <span className="font-serif mt-0.5 text-base font-semibold text-wine/80 tabular-nums">
            {stepMatch[1]}.
          </span>
          <span>{renderInline(stepMatch[2])}</span>
        </li>
      );
    }

    // Bullet items: "- item"
    if (trimmed.startsWith("- ")) {
      return (
        <li key={i} className="flex gap-2 font-sans text-sm leading-relaxed text-olive">
          <span className="mt-1 text-wine/60">·</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </li>
      );
    }

    // Empty line → small spacer
    if (!trimmed) {
      return <div key={i} className="h-1" />;
    }

    // Plain text (may contain inline bold)
    return (
      <p key={i} className="font-sans mt-2 text-sm leading-relaxed text-olive">
        {renderInline(trimmed)}
      </p>
    );
  });

  return (
    <article className="animate-recipe-enter rounded-menu border-[3px] border-double border-wine/85 bg-cream-soft shadow-menu overflow-hidden">
      <div className="border-b border-wine/20 bg-gradient-to-b from-cream-deep/90 to-cream-soft px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="w-16" />
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.4em] text-olive/75">
            La risposta
          </p>
          <button
            onClick={handleCopy}
            className="w-16 text-right font-sans text-xs text-olive/50 transition hover:text-wine"
            title="Copy to clipboard"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="px-8 py-7">
        <ul className="space-y-0.5 list-none m-0 p-0">{nodes}</ul>
      </div>

      <footer className="flex justify-center border-t border-wine/10 bg-cream-deep/30 px-6 py-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-wine/25 to-transparent" />
      </footer>
    </article>
  );
}
