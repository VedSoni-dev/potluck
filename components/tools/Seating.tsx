"use client";

import { GripVertical, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { uid } from "@/lib/id";
import type { Guest, SeatingTool } from "@/lib/types";
import { miniInput } from "../ui";
import type { ToolProps } from "./props";

type Drag = {
  id: string;
  name: string;
  x: number;
  y: number;
  ox: number;
  oy: number;
  w: number;
  sx: number;
  sy: number;
  moved: boolean;
};

const POOL = "__pool";

export function Seating({ tool, onChange, colorOf }: ToolProps<SeatingTool>) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [full, setFull] = useState<string | null>(null);
  const [guestDraft, setGuestDraft] = useState("");
  const dragRef = useRef<Drag | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const seated = (tableId: string) => tool.guests.filter((g) => g.tableId === tableId);
  const pool = tool.guests.filter((g) => g.tableId === null);

  function move(guestId: string, target: string) {
    const g = tool.guests.find((x) => x.id === guestId);
    if (!g) return;
    const tableId = target === POOL ? null : target;
    if (g.tableId === tableId) return;
    if (tableId) {
      const t = tool.tables.find((x) => x.id === tableId);
      if (!t) return;
      if (seated(tableId).length >= t.seats) {
        setFull(tableId);
        setTimeout(() => setFull(null), 1600);
        return;
      }
    }
    onChange({ ...tool, guests: tool.guests.map((x) => (x.id === guestId ? { ...x, tableId } : x)) });
  }

  function zoneAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]");
    if (!el || !rootRef.current?.contains(el)) return null;
    return el.dataset.drop ?? null;
  }

  /* Window-level listeners so a drag survives re-renders, fast moves and leaving the badge. */
  function onPointerDown(e: React.PointerEvent<HTMLElement>, g: Guest) {
    if (e.button !== 0) return;
    e.preventDefault();
    cleanupRef.current?.(); // drop any drag that never got its pointerup
    const r = e.currentTarget.getBoundingClientRect();
    const d: Drag = {
      id: g.id,
      name: g.name,
      x: e.clientX,
      y: e.clientY,
      ox: e.clientX - r.left,
      oy: e.clientY - r.top,
      w: r.width,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
    dragRef.current = d;
    setDrag({ ...d });

    const onMove = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      if (!cur.moved && Math.hypot(ev.clientX - cur.sx, ev.clientY - cur.sy) > 4) cur.moved = true;
      cur.x = ev.clientX;
      cur.y = ev.clientY;
      setDrag({ ...cur });
      if (cur.moved) setOver(zoneAt(ev.clientX, ev.clientY));
    };
    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      cleanupRef.current = null;
    };
    const finish = (ev: PointerEvent | null) => {
      detach();
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      setOver(null);
      if (!cur || !ev) return;
      if (cur.moved) {
        const target = zoneAt(ev.clientX, ev.clientY);
        if (target) move(cur.id, target);
        setSelected(null);
      } else {
        setSelected((s) => (s === cur.id ? null : cur.id));
      }
    };
    const onUp = (ev: PointerEvent) => finish(ev);
    const onCancel = () => finish(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    cleanupRef.current = () => {
      detach();
      dragRef.current = null;
    };
  }

  function zoneClick(target: string) {
    if (selected) {
      move(selected, target);
      setSelected(null);
    }
  }

  const badge = (g: Guest) => {
    const dragging = drag?.id === g.id && drag.moved;
    const isSel = selected === g.id;
    return (
      <span
        key={g.id}
        onPointerDown={(e) => onPointerDown(e, g)}
        onClick={(e) => e.stopPropagation()}
        role="button"
        tabIndex={0}
        aria-label={`${g.name}, drag to a table or press Enter to pick up`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected(isSel ? null : g.id);
          }
        }}
        className={`group/badge relative inline-flex h-8 cursor-grab touch-none select-none items-center gap-1.5 rounded-full border bg-card pl-1 pr-2.5 text-[13px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.04)] transition active:cursor-grabbing ${
          isSel ? "border-accent ring-2 ring-accent/30" : "border-line-2 hover:border-ink/40"
        } ${dragging ? "opacity-30" : ""}`}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: colorOf(g.name) }}
        >
          {g.name.slice(0, 2).toUpperCase()}
        </span>
        {g.name}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onChange({ ...tool, guests: tool.guests.filter((x) => x.id !== g.id) });
          }}
          className="-mr-1 hidden rounded-full p-0.5 text-muted hover:bg-bg-2 hover:text-bad group-hover/badge:inline-flex"
          aria-label={`Remove ${g.name}`}
        >
          <X size={11} />
        </button>
      </span>
    );
  };

  const capacity = tool.tables.reduce((s, t) => s + t.seats, 0);

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {tool.tables.map((t) => {
          const people = seated(t.id);
          const isOver = over === t.id;
          const isFull = people.length >= t.seats;
          return (
            <div
              key={t.id}
              data-drop={t.id}
              onClick={() => zoneClick(t.id)}
              className={`relative rounded-2xl border p-2.5 transition ${
                isOver
                  ? isFull
                    ? "border-bad/60 bg-bad/5"
                    : "border-accent bg-accent-soft/50"
                  : selected
                    ? "cursor-pointer border-dashed border-line-2 hover:border-accent"
                    : "border-line bg-bg/50"
              } ${full === t.id ? "nudge border-bad/60" : ""}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-line-2 bg-card">
                    <span className="h-2 w-2 rounded-full bg-line-2" />
                  </span>
                  <span className="text-sm font-semibold">{t.name}</span>
                </div>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    full === t.id ? "bg-bad text-white" : isFull ? "bg-ink text-bg" : "bg-bg-2 text-muted"
                  }`}
                >
                  {full === t.id ? "full" : `${people.length}/${t.seats}`}
                </span>
              </div>
              <div className="flex min-h-8 flex-wrap gap-1.5">
                {people.map(badge)}
                {Array.from({ length: Math.min(8, Math.max(0, t.seats - people.length)) }, (_, i) => (
                  <span
                    key={i}
                    title="Open spot"
                    aria-label="Open spot"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line-2 text-muted"
                  >
                    <Plus size={12} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        data-drop={POOL}
        onClick={() => zoneClick(POOL)}
        className={`rounded-2xl border border-dashed p-2.5 transition ${
          over === POOL ? "border-accent bg-accent-soft/40" : "border-line-2"
        }`}
      >
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-muted">
            <GripVertical size={12} /> Not placed yet · {pool.length}
          </span>
          <span className="text-muted">
            {tool.guests.length} people · {capacity} spots
          </span>
        </div>
        <div className="flex min-h-8 flex-wrap items-center gap-1.5">
          {pool.map(badge)}
          {pool.length === 0 && <span className="text-sm text-muted">Everyone has a spot. Drag someone here to unseat them.</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-48 flex-1 gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const name = guestDraft.trim().slice(0, 40);
            if (!name) return;
            onChange({ ...tool, guests: [...tool.guests, { id: uid(), name, tableId: null }] });
            setGuestDraft("");
          }}
        >
          <input value={guestDraft} onChange={(e) => setGuestDraft(e.target.value)} placeholder="Add a person" className={miniInput} />
          <button type="submit" className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label="Add person">
            <Plus size={16} />
          </button>
        </form>
        <button
          onClick={() =>
            onChange({
              ...tool,
              tables: [...tool.tables, { id: uid(), name: `Table ${tool.tables.length + 1}`, seats: 4 }],
            })
          }
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm text-muted hover:bg-bg-2 hover:text-ink"
        >
          <Plus size={15} /> Add table
        </button>
        <span className="ml-auto hidden text-xs text-muted sm:inline">
          {selected ? "Now tap a table to move them" : "Drag a badge, or tap it then tap a table"}
        </span>
      </div>

      {drag?.moved && (
        <span
          className="pointer-events-none fixed z-50 inline-flex h-8 rotate-[-3deg] items-center gap-1.5 rounded-full border border-accent bg-card pl-1 pr-2.5 text-[13px] font-medium shadow-xl"
          style={{ left: drag.x - drag.ox, top: drag.y - drag.oy, minWidth: drag.w }}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: colorOf(drag.name) }}
          >
            {drag.name.slice(0, 2).toUpperCase()}
          </span>
          {drag.name}
        </span>
      )}
    </div>
  );
}
