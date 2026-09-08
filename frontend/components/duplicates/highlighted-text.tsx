const STOP_WORDS = new Set(["of", "in", "the", "and", "at", "to", "for", "a", "an", "on", "by", "with", "&"]);

function normalize(token: string) {
  return token.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Tokens (≥3 chars, non-stopword) appearing in both descriptions. */
export function sharedTokens(a: string, b: string): Set<string> {
  const tokensB = new Set(b.split(/\s+/).map(normalize).filter((t) => t.length >= 3 && !STOP_WORDS.has(t)));
  const shared = new Set<string>();
  for (const raw of a.split(/\s+/)) {
    const t = normalize(raw);
    if (t.length >= 3 && !STOP_WORDS.has(t) && tokensB.has(t)) shared.add(t);
  }
  return shared;
}

export function HighlightedText({ text, shared }: { text: string; shared: Set<string> }) {
  if (!text) return <>—</>;
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\s+$/.test(part) || !shared.has(normalize(part))) return <span key={i}>{part}</span>;
        return (
          <mark key={i} className="rounded-sm bg-secondary px-0.5 text-secondary-foreground">
            {part}
          </mark>
        );
      })}
    </>
  );
}
