"use client";

import { Check, CornerDownLeft, LayoutTemplate, Share2, Sparkles, X } from "lucide-react";
import type { AiStatus } from "@/lib/ai";

export type GuideState = { hidden: boolean; touched: boolean; shared: boolean };
export const GUIDE_START: GuideState = { hidden: false, touched: false, shared: false };

/** The inline how-to in a new plan: three steps, each ticks itself off. Not a modal: the plan stays usable. */
export function GuideCard({
  title,
  examples,
  ai,
  hasTools,
  onlyYou,
  state,
  onExample,
  onStarters,
  onShare,
  onSettings,
  onHide,
}: {
  title: string;
  examples: string[];
  ai: AiStatus;
  hasTools: boolean;
  onlyYou: boolean;
  state: GuideState;
  onExample: (prompt: string) => void;
  onStarters: () => void;
  onShare: () => void;
  onSettings: () => void;
  onHide: () => void;
}) {
  const done = [hasTools, state.touched, state.shared];
  const allDone = done.every(Boolean);
  return (
    <section
      aria-label="How to use potluck"
      className="pop relative overflow-hidden rounded-2xl border border-accent/25 bg-card shadow-card"
      style={{ backgroundImage: "linear-gradient(135deg, color-mix(in oklab, var(--accent-soft) 70%, transparent), transparent 55%)" }}
    >
      <div className="flex items-start gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {allDone ? "You're set. Your group can take it from here." : <>Get “{title || "your plan"}” going</>}
          </h2>
          <p className="text-sm text-muted">Three steps. Each one ticks itself off as you go.</p>
        </div>
        <button onClick={onHide} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-bg-2 hover:text-ink" aria-label="Hide this guide">
          {allDone ? "Done" : "Hide"} <X size={14} />
        </button>
      </div>

      <ol className="grid gap-px p-2 sm:p-3 md:grid-cols-[1.35fr_1fr_1fr] md:gap-2">
        <Step n={1} done={done[0]} title="Ask @potluck for a tool">
          <p>Say what you need in plain words. Try one:</p>
          <div className="mt-2 space-y-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => onExample(ex)}
                className="group flex w-full items-start gap-2 rounded-xl border border-line bg-card px-2.5 py-2 text-left text-[13px] leading-snug text-ink transition hover:border-accent hover:bg-accent-soft/50"
              >
                <span className="min-w-0 flex-1">“{ex}”</span>
                <CornerDownLeft size={13} className="mt-0.5 shrink-0 text-muted group-hover:text-accent" />
              </button>
            ))}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs">
            <button onClick={onStarters} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              <LayoutTemplate size={12} /> or browse starters
            </button>
            {!ai.on && (
              <>
                <span className="text-muted">·</span>
                <button onClick={onSettings} className="font-medium text-ink-2 underline underline-offset-2 hover:text-ink">
                  AI is off, so these match starters. Turn it on
                </button>
              </>
            )}
          </p>
        </Step>

        <Step n={2} done={done[1]} title="Use it right where it lands">
          <p>
            Every tool is live: tap an option to vote, drag names between rooms, log who paid and see who owes whom. Tap a name
            under <b className="font-semibold text-ink">People</b> to act as them.
          </p>
          <p className="mt-2">
            The <Sparkles size={12} className="inline align-[-1px] text-accent" aria-label="sparkle" /> on a tool changes it with a sentence: “add a vegetarian option”.
          </p>
          {onlyYou && <p className="mt-2 font-medium text-ink-2">Add your people on the right so the tools use their names.</p>}
        </Step>

        <Step n={3} done={done[2]} title="Share the link with the group">
          <p>One link carries the whole plan. Friends open it on their phone, vote and drag, and send their version back.</p>
          <button
            onClick={onShare}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            <Share2 size={14} /> Share
          </button>
        </Step>
      </ol>
    </section>
  );
}

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl p-3 text-[13px] leading-relaxed text-muted md:bg-card/50">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
            done ? "bg-good text-white" : "bg-accent text-accent-ink"
          }`}
          aria-label={done ? `Step ${n}, done` : `Step ${n}`}
        >
          {done ? <Check size={14} strokeWidth={3} /> : n}
        </span>
        <h3 className={`text-sm font-semibold ${done ? "text-muted line-through decoration-good/60" : "text-ink"}`}>{title}</h3>
      </div>
      {children}
    </li>
  );
}
