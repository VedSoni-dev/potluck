"use client";

import { Check, Crown, Plus } from "lucide-react";
import { useState } from "react";
import { uid } from "@/lib/id";
import type { PollTool } from "@/lib/types";
import { Avatar, miniInput } from "../ui";
import type { ToolProps } from "./props";

export function Poll({ tool, onChange, me, colorOf }: ToolProps<PollTool>) {
  const [draft, setDraft] = useState("");
  const voters = new Set(tool.options.flatMap((o) => o.votes));
  const max = Math.max(1, ...tool.options.map((o) => o.votes.length));
  const leader = Math.max(...tool.options.map((o) => o.votes.length));

  function vote(optionId: string) {
    onChange({
      ...tool,
      options: tool.options.map((o) => {
        const has = o.votes.includes(me);
        if (o.id === optionId) return { ...o, votes: has ? o.votes.filter((v) => v !== me) : [...o.votes, me] };
        return { ...o, votes: o.votes.filter((v) => v !== me) };
      }),
    });
  }

  function add() {
    const label = draft.trim();
    if (!label) return;
    onChange({ ...tool, options: [...tool.options, { id: uid(), label, votes: [] }] });
    setDraft("");
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[15px] font-medium leading-snug text-ink">{tool.question}</p>
      <ul className="space-y-2">
        {tool.options.map((o) => {
          const mine = o.votes.includes(me);
          const pct = (o.votes.length / max) * 100;
          const top = leader > 0 && o.votes.length === leader;
          return (
            <li key={o.id}>
              <button
                onClick={() => vote(o.id)}
                className={`group relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition ${
                  mine ? "border-accent bg-accent-soft/40" : "border-line hover:border-line-2"
                }`}
                aria-pressed={mine}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-accent/12 transition-[width] duration-300 dark:bg-accent/20"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative flex items-center gap-2">
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
                      mine ? "border-accent bg-accent text-accent-ink" : "border-line-2"
                    }`}
                  >
                    {mine && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.label}</span>
                  {top && <Crown size={14} className="shrink-0 text-accent" aria-label="Leading" />}
                  <span className="flex -space-x-1.5">
                    {o.votes.slice(0, 3).map((v) => (
                      <Avatar key={v} name={v} color={colorOf(v)} size={20} ring />
                    ))}
                  </span>
                  <span className="w-4 text-right text-sm tabular-nums text-muted">{o.votes.length}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <form
          className="flex flex-1 gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Add an option · voting as ${me}`} className={miniInput} />
          <button type="submit" className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label="Add option">
            <Plus size={16} />
          </button>
        </form>
        <span className="shrink-0 text-xs text-muted">{voters.size} voted</span>
      </div>
    </div>
  );
}
