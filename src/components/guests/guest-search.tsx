"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

// Live search over the guests table. Every guest row carries the text to search in data-search (name, contact,
// tag, plus-ones, dietary note, song, where they are staying, how they have answered) and the digits of their phone
// number in data-digits; this hides the rows that don't match as you type. The rows are drawn by the server, so this
// only toggles a class on them, and combines with the guest-list (tag) buttons, which are applied by the server.
export function GuestSearch({ total }: { total: number }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(total);
  const box = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const rows = [...document.querySelectorAll<HTMLElement>("[data-guest-row]")];
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    let n = 0;
    for (const row of rows) {
      const hit =
        !q ||
        (row.dataset.search ?? "").includes(q) ||
        (digits.length >= 3 && (row.dataset.digits ?? "").includes(digits));
      row.classList.toggle("search-hide", !hit);
      if (hit) n++;
    }
    const tell = setTimeout(() => setShown(n), 0); // after the effect, not inside it
    return () => {
      clearTimeout(tell);
      rows.forEach((r) => r.classList.remove("search-hide"));
    };
  }, [query, total]);

  // "/" jumps to the search box, like most search boxes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      e.preventDefault();
      box.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const searching = query.trim() !== "";
  return (
    <div className="grid gap-1.5">
      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          ref={box}
          type="text"
          inputMode="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
          }}
          placeholder="Search name, phone, dietary, song…"
          aria-label="Search guests"
          className="pr-8 pl-8"
        />
        {searching && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute top-2 right-2 rounded p-0.5 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>
      {searching && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {shown === 0 ? "No guests match." : `Showing ${shown} of ${total} guest${total === 1 ? "" : "s"}.`}
        </p>
      )}
    </div>
  );
}
