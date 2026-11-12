"use client";

import { RotateCcw, Trophy } from "lucide-react";
import { buildBracket, roundName, type Match } from "@/lib/math";
import type { BracketTool } from "@/lib/types";
import type { ToolProps } from "./props";

export function Bracket({ tool, onChange, colorOf }: ToolProps<BracketTool>) {
  const { rounds, champion } = buildBracket(tool);

  function pick(m: Match, name: string | null) {
    if (!name || !m.a || !m.b || m.bye) return;
    const winners = { ...tool.winners };
    if (winners[m.key] === name) delete winners[m.key];
    else winners[m.key] = name;
    onChange({ ...tool, winners });
  }

  const slot = (m: Match, name: string | null) => {
    const won = m.winner !== null && m.winner === name;
    const lost = m.winner !== null && name !== null && m.winner !== name;
    const clickable = !!name && !!m.a && !!m.b && !m.bye;
    return (
      <button
        disabled={!clickable}
        onClick={() => pick(m, name)}
        className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-[13px] transition ${
          won ? "bg-accent-soft font-semibold text-ink" : lost ? "text-muted line-through decoration-line-2" : ""
        } ${clickable ? "hover:bg-bg-2" : "cursor-default"}`}
      >
        {name ? (
          <>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(name) }} />
            <span className="truncate">{name}</span>
          </>
        ) : (
          <span className="italic text-muted">{m.bye && m.round === 0 ? "bye" : "TBD"}</span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-3">
          {rounds.map((round, r) => (
            <div key={r} className="flex w-36 flex-col">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                {roundName(r, rounds.length)}
              </div>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {round.map((m) => (
                  <div
                    key={m.key}
                    className={`divide-y divide-line overflow-hidden rounded-lg border border-line bg-card ${
                      m.bye ? "opacity-60" : ""
                    }`}
                  >
                    {slot(m, m.a)}
                    {slot(m, m.b)}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex w-32 flex-col">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Champion</div>
            <div className="flex flex-1 items-center">
              <div
                className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2.5 text-sm ${
                  champion ? "border-accent bg-accent-soft font-semibold" : "border-dashed border-line-2 text-muted"
                }`}
              >
                <Trophy size={15} className={champion ? "text-accent" : ""} />
                <span className="truncate">{champion ?? "to be decided"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Tap a name to send them through. Tap again to undo.</span>
        {Object.keys(tool.winners).length > 0 && (
          <button
            onClick={() => onChange({ ...tool, winners: {} })}
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-bg-2 hover:text-ink"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
