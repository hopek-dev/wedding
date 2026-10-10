"use client";

import { useEffect, useRef, useState } from "react";
import { InvitationCard } from "@/components/rsvp/invitation-card";
import type { InviteSummary } from "@/lib/invitation";
import "./envelope.css";

type Stage = "closed" | "opening" | "card" | "leaving" | "done";

// A sealed envelope the guest taps. The flap opens, the invitation rises out,
// the envelope falls away, and then the normal RSVP page fades in underneath.
export function EnvelopeIntro({
  firstName,
  summary,
  deadline,
  cookieName,
  skip,
  children,
}: {
  firstName: string;
  summary: InviteSummary;
  deadline: string | null;
  cookieName: string | null; // remembers that this guest has opened it; null = always show (preview)
  skip: boolean;
  children: React.ReactNode;
}) {
  const [stage, setStage] = useState<Stage>(skip ? "done" : "closed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Keep the page behind from scrolling while the envelope is up.
  useEffect(() => {
    if (stage === "done") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [stage]);

  function remember() {
    if (cookieName) document.cookie = `${cookieName}=1; path=/rsvp; max-age=31536000; SameSite=Lax`;
  }

  function open() {
    if (stage !== "closed") return;
    setStage("opening");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    later(() => setStage("card"), reduced ? 60 : 2000);
  }

  function proceed() {
    if (stage === "leaving" || stage === "done") return;
    setStage("leaving");
    remember();
    later(() => setStage("done"), 800);
  }

  const waiting = stage !== "leaving" && stage !== "done";

  return (
    <>
      {stage !== "done" && (
        <div className={`env-scene is-${stage}`} role="dialog" aria-label="Your invitation">
          <button type="button" className="env-skip" onClick={proceed}>
            Skip
          </button>
          <div
            className="env"
            role="button"
            tabIndex={stage === "closed" ? 0 : -1}
            aria-label="Open your invitation"
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }}
          >
            <div className="env-part env-back" />
            <div className="env-card-wrap">
              <InvitationCard summary={summary} deadline={deadline} />
            </div>
            <div className="env-part env-pocket">
              <i className="l" />
              <i className="r" />
              <i className="b" />
            </div>
            <div className="env-part env-to">
              <small>For</small>
              {firstName}
            </div>
            <div className="env-part env-flap" />
            <div className="env-seal" aria-hidden>
              V&amp;H
            </div>
          </div>
          {/* Full-size invitation, shown once the card is out of the envelope. */}
          <div className="inv-reader">
            <InvitationCard summary={summary} deadline={deadline} />
          </div>
          <p className="env-hint">Tap to open</p>
          <button type="button" className="env-continue" onClick={proceed}>
            Continue to RSVP
          </button>
        </div>
      )}
      <div className={`env-page${waiting ? " is-waiting" : ""}`} inert={waiting}>
        {children}
      </div>
    </>
  );
}
