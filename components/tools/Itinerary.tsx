"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { uid } from "@/lib/id";
import type { ItineraryTool } from "@/lib/types";
import { miniInput } from "../ui";
import type { ToolProps } from "./props";

export function Itinerary({ tool, onChange }: ToolProps<ItineraryTool>) {
  const [adding, setAdding] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [text, setText] = useState("");

  function add(dayId: string) {
    if (!text.trim()) return;
    onChange({
      ...tool,
      days: tool.days.map((d) =>
        d.id === dayId
          ? { ...d, items: [...d.items, { id: uid(), time: time.trim().slice(0, 24), text: text.trim().slice(0, 160) }] }
          : d,
      ),
    });
    setTime("");
    setText("");
    setAdding(null);
  }

  return (
    <div className="space-y-3">
      {tool.days.map((d) => (
        <section key={d.id}>
          <div className="mb-1 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">{d.label}</h4>
            <button
              onClick={() => setAdding(adding === d.id ? null : d.id)}
              className="rounded p-0.5 text-muted hover:bg-bg-2 hover:text-ink"
              aria-label={`Add to ${d.label}`}
            >
              <Plus size={14} />
            </button>
          </div>
          <ol className="relative ml-1.5 space-y-1 border-l border-line pl-3.5">
            {d.items.map((it) => (
              <li key={it.id} className="group relative flex items-baseline gap-2 text-sm">
                <span className="absolute -left-[19px] top-[7px] h-2 w-2 rounded-full border-2 border-card bg-accent" />
                <span className="w-16 shrink-0 text-xs tabular-nums text-muted">{it.time}</span>
                <span className="min-w-0 flex-1">{it.text}</span>
                <button
                  onClick={() =>
                    onChange({
                      ...tool,
                      days: tool.days.map((x) => (x.id === d.id ? { ...x, items: x.items.filter((y) => y.id !== it.id) } : x)),
                    })
                  }
                  className="self-center rounded p-0.5 text-muted opacity-0 transition hover:text-bad group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Remove ${it.text}`}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
            {d.items.length === 0 && <li className="text-sm text-muted">Nothing yet</li>}
          </ol>
          {adding === d.id && (
            <form
              className="mt-1.5 flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                add(d.id);
              }}
            >
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Time" className={`${miniInput} max-w-20`} />
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="What's happening" className={miniInput} />
              <button type="submit" className="rounded-lg bg-ink px-2.5 text-xs font-medium text-bg">
                Add
              </button>
            </form>
          )}
        </section>
      ))}
      <button
        onClick={() =>
          onChange({ ...tool, days: [...tool.days, { id: uid(), label: `Day ${tool.days.length + 1}`, items: [] }] })
        }
        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm text-muted hover:bg-bg-2 hover:text-ink"
      >
        <Plus size={15} /> Add a day
      </button>
    </div>
  );
}
