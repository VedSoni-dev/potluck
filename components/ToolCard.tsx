"use client";

import {
  Armchair,
  ChartNoAxesColumn,
  ListChecks,
  Receipt,
  Route,
  Sparkles,
  Trash2,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Tool, ToolType } from "@/lib/types";
import { TOOL_LABEL } from "@/lib/types";
import { Bracket } from "./tools/Bracket";
import { Checklist } from "./tools/Checklist";
import { Expenses } from "./tools/Expenses";
import { Itinerary } from "./tools/Itinerary";
import { Poll } from "./tools/Poll";
import { Seating } from "./tools/Seating";

export const TOOL_ICON: Record<ToolType, LucideIcon> = {
  itinerary: Route,
  poll: ChartNoAxesColumn,
  expenses: Receipt,
  bracket: Trophy,
  seating: Armchair,
  checklist: ListChecks,
};

export const TOOL_HUE: Record<ToolType, string> = {
  itinerary: "#0b7285",
  poll: "#5f3dc4",
  expenses: "#b35c00",
  bracket: "#c2255c",
  seating: "#1864ab",
  checklist: "#2b8a3e",
};

export const WIDE: ToolType[] = ["seating", "bracket"];

export function ToolCard({
  tool,
  onChange,
  onRemove,
  onTweak,
  me,
  people,
  colorOf,
  fresh,
  tweaking,
}: {
  tool: Tool;
  onChange: (t: Tool) => void;
  onRemove: () => void;
  onTweak: () => void;
  me: string;
  people: string[];
  colorOf: (n: string) => string;
  fresh: boolean;
  tweaking: boolean;
}) {
  const Icon = TOOL_ICON[tool.type];
  const hue = TOOL_HUE[tool.type];
  const common = { me, people, colorOf };

  return (
    <article
      id={`tool-${tool.id}`}
      className={`group/card flex flex-col rounded-2xl border bg-card shadow-card transition ${
        WIDE.includes(tool.type) ? "md:col-span-2" : ""
      } ${tweaking ? "border-accent ring-2 ring-accent/25" : "border-line"} ${fresh ? "pop ring-2 ring-accent/40" : ""}`}
    >
      <header className="flex items-start gap-2.5 px-4 pt-3.5">
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${hue} 14%, transparent)`, color: hue }}
        >
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <input
            value={tool.title}
            onChange={(e) => onChange({ ...tool, title: e.target.value.slice(0, 80) } as Tool)}
            className="w-full truncate rounded bg-transparent font-display text-[17px] font-semibold leading-tight tracking-tight outline-none focus:bg-bg-2"
            aria-label="Tool title"
          />
          <div className="mt-0.5 truncate text-xs text-muted">
            <span style={{ color: hue }} className="font-medium">
              {TOOL_LABEL[tool.type]}
            </span>
            {tool.prompt && (
              <>
                {" "}
                · {tool.by ? `${tool.by} asked ` : ""}
                <span className="italic">“{tool.prompt}”</span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition group-hover/card:opacity-100">
          <button
            onClick={onTweak}
            className={`rounded-lg p-1.5 hover:bg-bg-2 hover:text-accent ${tweaking ? "text-accent" : "text-muted"}`}
            title="Change this tool with a sentence"
            aria-label="Change with the agent"
          >
            <Sparkles size={15} />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-bad"
            title="Remove tool"
            aria-label="Remove tool"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>
      <div className="flex-1 px-4 pb-4 pt-3">
        {tool.type === "poll" && <Poll tool={tool} onChange={onChange} {...common} />}
        {tool.type === "expenses" && <Expenses tool={tool} onChange={onChange} {...common} />}
        {tool.type === "checklist" && <Checklist tool={tool} onChange={onChange} {...common} />}
        {tool.type === "itinerary" && <Itinerary tool={tool} onChange={onChange} {...common} />}
        {tool.type === "bracket" && <Bracket tool={tool} onChange={onChange} {...common} />}
        {tool.type === "seating" && <Seating tool={tool} onChange={onChange} {...common} />}
      </div>
    </article>
  );
}
