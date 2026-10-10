import { Fragment } from "react";

// Turns [words](https://address) in a piece of text into links that open in a new tab.
// Only web addresses are linked; anything else in the brackets stays as plain text.
const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

export function LinkedText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(LINK)) {
    const start = m.index ?? 0;
    if (start > last) out.push(<Fragment key={key++}>{text.slice(last, start)}</Fragment>);
    out.push(
      <a
        key={key++}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
      >
        {m[1]}
      </a>
    );
    last = start + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}
