"use client";

import { ArrowUp, KeyRound, LoaderCircle, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";

const SUGGESTIONS = [
  "a poll for friday's hike: easy, medium or summit",
  "split $340 for the cabin hot tub between everyone",
  "seating chart for 3 tables of 6",
  "bracket for 8 teams",
  "chore rota for the week",
];

export function AgentBar({
  value,
  onChange,
  onSubmit,
  busy,
  hasKey,
  model,
  error,
  topUpUrl,
  targetTitle,
  onClearTarget,
  onOpenSettings,
  onOpenTemplates,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  hasKey: boolean;
  model: string;
  error: string;
  /** publik API 402: the one link next to its message. */
  topUpUrl?: string;
  targetTitle: string | null;
  onClearTarget: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (targetTitle) ref.current?.focus();
  }, [targetTitle]);

  return (
    <div className="space-y-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onSubmit();
        }}
        className="flex items-center gap-2 rounded-2xl border border-line-2 bg-card p-1.5 pl-2 shadow-card focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15"
      >
        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-accent px-2.5 py-1.5 text-sm font-semibold text-accent-ink">
          <Sparkles size={14} />
          @potluck
        </span>
        {targetTitle && (
          <span className="inline-flex max-w-44 shrink-0 items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-xs font-medium">
            <span className="truncate">change “{targetTitle}”</span>
            <button type="button" onClick={onClearTarget} aria-label="Stop changing this tool" className="text-muted hover:text-ink">
              <X size={12} />
            </button>
          </span>
        )}
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            targetTitle ? "say what to change: add an option, rename the tables…" : "build us a… dinner poll, expense split, bracket, seating chart"
          }
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-muted"
          aria-label="Ask the agent to build a tool"
          maxLength={600}
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-bg transition hover:bg-ink-2 disabled:bg-bg-2 disabled:text-muted"
          aria-label="Build it"
        >
          {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowUp size={17} strokeWidth={2.5} />}
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad" role="alert">
          {error}
          {topUpUrl && (
            <>
              {" "}
              <a href={topUpUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                Top up on publik
              </a>
            </>
          )}
        </p>
      )}

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
        {hasKey ? (
          <button
            onClick={onOpenSettings}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-2.5 py-1 text-xs font-medium text-good"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-good" /> Custom tools on · {model}
          </button>
        ) : (
          <button
            onClick={onOpenSettings}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-2 bg-card px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-accent"
          >
            <KeyRound size={12} /> Demo mode: matches starters · turn on AI for custom tools
          </button>
        )}
        <button
          onClick={onOpenTemplates}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
        >
          Browse starters
        </button>
        <span className="mx-0.5 h-3 w-px shrink-0 bg-line-2" />
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              onChange(s);
              ref.current?.focus();
            }}
            className="shrink-0 rounded-full border border-line bg-card/70 px-2.5 py-1 text-xs text-ink-2 hover:border-line-2 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
