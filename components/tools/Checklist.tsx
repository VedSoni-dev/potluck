"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { uid } from "@/lib/id";
import type { ChecklistTool } from "@/lib/types";
import { Avatar, miniInput } from "../ui";
import type { ToolProps } from "./props";

export function Checklist({ tool, onChange, people, colorOf }: ToolProps<ChecklistTool>) {
  const [draft, setDraft] = useState("");
  const done = tool.items.filter((i) => i.done).length;

  const set = (id: string, patch: Partial<ChecklistTool["items"][number]>) =>
    onChange({ ...tool, items: tool.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  function cycleWho(id: string, who?: string) {
    const order = [undefined, ...people];
    const next = order[(order.indexOf(who) + 1) % order.length];
    set(id, { who: next });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-2">
          <div
            className="h-full rounded-full bg-good transition-[width] duration-300"
            style={{ width: `${tool.items.length ? (done / tool.items.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted">
          {done}/{tool.items.length}
        </span>
      </div>
      <ul className="space-y-0.5">
        {tool.items.map((i) => (
          <li key={i.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-bg-2/60">
            <button
              onClick={() => set(i.id, { done: !i.done })}
              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition ${
                i.done ? "border-good bg-good text-white" : "border-line-2 hover:border-ink"
              }`}
              aria-label={i.done ? `Mark ${i.text} not done` : `Mark ${i.text} done`}
              aria-pressed={i.done}
            >
              {i.done && <Check size={12} strokeWidth={3} />}
            </button>
            <span className={`min-w-0 flex-1 truncate text-sm ${i.done ? "text-muted line-through" : ""}`}>{i.text}</span>
            <button
              onClick={() => cycleWho(i.id, i.who)}
              className="flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 text-xs text-muted hover:bg-bg-2"
              title="Tap to reassign"
            >
              {i.who ? (
                <>
                  <Avatar name={i.who} color={colorOf(i.who)} size={18} />
                  {i.who}
                </>
              ) : (
                <span className="pl-1.5">anyone</span>
              )}
            </button>
            <button
              onClick={() => onChange({ ...tool, items: tool.items.filter((x) => x.id !== i.id) })}
              className="rounded p-0.5 text-muted opacity-0 transition hover:text-bad group-hover:opacity-100 focus:opacity-100"
              aria-label={`Remove ${i.text}`}
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          onChange({ ...tool, items: [...tool.items, { id: uid(), text: text.slice(0, 140), done: false }] });
          setDraft("");
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an item" className={miniInput} />
        <button type="submit" className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label="Add item">
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
