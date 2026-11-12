"use client";

import { ArrowLeft, ArrowRight, Plus, Sparkles, UserRound, X } from "lucide-react";
import { useRef, useState } from "react";
import type { AiStatus } from "@/lib/ai";
import { colorFor } from "@/lib/id";
import { Avatar, Logo } from "./ui";

const IDEAS = ["Lisbon in May", "Sam's 30th", "Friday game night", "Flat chores"];

export type NewPlan = { title: string; subtitle: string; you: string; others: string[] };

/** First run (and "New plan"): name the plan, add the people, create it. */
export function Onboarding({
  ai,
  notice,
  onCreate,
  onSample,
  back,
}: {
  ai: AiStatus;
  notice?: string;
  onCreate: (plan: NewPlan) => void;
  onSample: () => void;
  /** e.g. "Back to “Lisbon in May”" when this device already has a plan */
  back?: { label: string; run: () => void };
}) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [you, setYou] = useState("");
  const [others, setOthers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [nudge, setNudge] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const taken = (name: string, list = others) =>
    [you.trim() || "You", ...list].some((n) => n.toLowerCase() === name.toLowerCase());

  /** Adds one name, or several pasted with commas. Returns the new list. */
  function addNames(raw: string): string[] {
    let next = others;
    for (const part of raw.split(/[,\n]/)) {
      const name = part.trim().slice(0, 40);
      if (name && !taken(name, next) && next.length < 39) next = [...next, name];
    }
    setOthers(next);
    setDraft("");
    return next;
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setNudge(true);
      setTimeout(() => setNudge(false), 600);
      titleRef.current?.focus();
      return;
    }
    const list = draft.trim() ? addNames(draft) : others;
    onCreate({ title: title.trim().slice(0, 80), subtitle: subtitle.trim().slice(0, 140), you: you.trim().slice(0, 40) || "You", others: list });
  }

  return (
    <div className="canvas-dots flex min-h-screen flex-col">
      <header className="mx-auto flex h-14 w-full max-w-[1500px] items-center gap-2 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2" aria-label="Potluck home">
          <Logo />
          <span className="font-display text-[19px] font-bold tracking-tight">potluck</span>
        </a>
        {back && (
          <button onClick={back.run} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:bg-bg-2 hover:text-ink">
            <ArrowLeft size={15} /> <span className="max-w-[46vw] truncate">{back.label}</span>
          </button>
        )}
      </header>

      <main className="flex flex-1 justify-center px-4 pb-14 pt-6 sm:items-center sm:pt-2">
        <div className="pop w-full max-w-[540px]">
          {notice && <p className="mb-4 rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink-2">{notice}</p>}
          <p className="text-sm font-semibold text-accent">New plan</p>
          <h1 className="mt-1 font-display text-[40px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[52px]">Start your plan</h1>
          <p className="mt-2.5 max-w-[460px] text-[15px] leading-relaxed text-muted">
            Name it and add your people. Then ask @potluck for the polls, splits and seating charts you need, filled in with their names.
          </p>

          <form onSubmit={create} className="mt-7 space-y-5 rounded-3xl border border-line bg-card p-5 shadow-card sm:p-6">
            <div>
              <label htmlFor="plan-title" className="text-sm font-semibold">
                What are you planning?
              </label>
              <input
                id="plan-title"
                ref={titleRef}
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lisbon in May"
                maxLength={80}
                className={`mt-1.5 w-full rounded-2xl border border-line bg-bg/60 px-4 py-3 font-display text-[22px] font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-muted/70 focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/15 ${nudge ? "nudge border-bad" : ""}`}
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                <span>Ideas:</span>
                {IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setTitle(idea)}
                    className="rounded-full border border-line px-2.5 py-1 text-ink-2 hover:border-line-2 hover:bg-bg-2"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="plan-details" className="text-sm font-semibold">
                Details <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="plan-details"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Dates, place, budget… e.g. May 14–18 · a flat in Alfama"
                maxLength={140}
                className="mt-1.5 w-full rounded-xl border border-line bg-bg/60 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/15"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Who&apos;s in?</span>
                <span className="text-xs text-muted">{1 + others.length} {others.length ? "people" : "person"}</span>
              </div>
              <div className="mt-1.5 rounded-2xl border border-line bg-bg/60 p-2 focus-within:border-line-2">
                <div className="flex items-center gap-2 rounded-xl bg-card px-2 py-1.5">
                  {you.trim() ? (
                    <Avatar name={you.trim()} color={colorFor(0)} size={28} />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ background: colorFor(0) }}>
                      <UserRound size={15} />
                    </span>
                  )}
                  <input
                    value={you}
                    onChange={(e) => setYou(e.target.value)}
                    placeholder="Your name"
                    maxLength={40}
                    aria-label="Your name"
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-muted/70"
                  />
                  <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase text-bg">you</span>
                </div>
                {others.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5 px-0.5">
                    {others.map((name, i) => (
                      <li key={name} className="pop flex items-center gap-1.5 rounded-full border border-line bg-card py-0.5 pl-0.5 pr-1.5 text-sm">
                        <Avatar name={name} color={colorFor(i + 1)} size={22} />
                        {name}
                        <button
                          type="button"
                          onClick={() => setOthers(others.filter((n) => n !== name))}
                          className="rounded-full p-0.5 text-muted hover:bg-bg-2 hover:text-bad"
                          aria-label={`Remove ${name}`}
                        >
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 px-1">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        if (draft.trim()) addNames(draft);
                      } else if (e.key === "Backspace" && !draft && others.length) {
                        setOthers(others.slice(0, -1));
                      }
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      if (/[,\n]/.test(text)) {
                        e.preventDefault();
                        addNames(draft + text);
                      }
                    }}
                    placeholder={others.length ? "Add another…" : "Add a friend's name, press Enter"}
                    maxLength={200}
                    aria-label="Add a person"
                    className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-muted/70"
                  />
                  <button
                    type="button"
                    onClick={() => draft.trim() && addNames(draft)}
                    disabled={!draft.trim()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-bg-2 hover:text-ink disabled:opacity-40"
                    aria-label="Add person"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted">Tools fill in these names. You can add more later, or paste a list with commas.</p>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3.5 text-[15px] font-semibold text-bg transition hover:bg-ink-2 active:scale-[0.99]"
            >
              Create plan <ArrowRight size={17} />
            </button>

            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted">
              <Sparkles size={13} className={`mt-0.5 shrink-0 ${ai.on ? "text-good" : ""}`} />
              <span>{ai.on ? `${ai.label}. Ask for any tool in plain words.` : `${ai.label}. Until then, asks match the starter tools.`}</span>
            </p>
          </form>

          <div className="mt-5 text-center">
            <button onClick={onSample} className="text-sm font-medium text-muted underline decoration-line-2 underline-offset-4 hover:text-ink hover:decoration-ink">
              or look at an example first
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-muted">Saved in this browser. Share it with one link when you&apos;re ready.</p>
        </div>
      </main>
    </div>
  );
}
