"use client";

import { useSyncExternalStore } from "react";

// A live countdown to the start of the wedding day (London time; in March that is
// the same as UTC). Reads the clock through useSyncExternalStore so the server render
// and first paint agree, then ticks every second.
const subscribe = (notify: () => void) => {
  const t = setInterval(notify, 1000);
  return () => clearInterval(t);
};
const now = () => Math.floor(Date.now() / 1000);

export function Countdown({ target }: { target: string }) {
  const nowSeconds = useSyncExternalStore(subscribe, now, () => 0);
  const left = nowSeconds === 0 ? null : Math.max(0, Math.floor(Date.parse(target) / 1000) - nowSeconds);
  const parts = [
    { label: "Days", value: left === null ? null : Math.floor(left / 86400) },
    { label: "Hours", value: left === null ? null : Math.floor((left % 86400) / 3600) },
    { label: "Minutes", value: left === null ? null : Math.floor((left % 3600) / 60) },
    { label: "Seconds", value: left === null ? null : left % 60 },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4" role="timer" aria-label="Time until the wedding">
      {parts.map((p) => (
        <div key={p.label} className="text-center">
          <div className="text-[1.7rem] font-light tabular-nums sm:text-5xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
            {p.value === null ? "--" : String(p.value).padStart(p.label === "Days" ? 1 : 2, "0")}
          </div>
          <div className="mt-1 text-[10px] font-light tracking-[0.3em] text-muted-foreground uppercase sm:text-[11px]">{p.label}</div>
        </div>
      ))}
    </div>
  );
}
