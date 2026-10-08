"use client";

import { useEffect } from "react";

// The planner runs in dark mode, but guests should see the same light, cream
// look as the wedding website. The inline script switches the theme during the
// first paint (no dark flash); the effect restores it if the page is left.
export function GuestTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      if (wasDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      }
    };
  }, []);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: "document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';",
      }}
    />
  );
}
