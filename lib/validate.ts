import { colorFor, uid } from "./id";
import type {
  CheckItem,
  Expense,
  Guest,
  ItineraryDay,
  Member,
  Pin,
  PollOption,
  SeatTable,
  Space,
  Tool,
} from "./types";
import { TOOL_TYPES } from "./types";

/*
 * Everything that enters the app from outside (the agent, a share link, an
 * imported file) goes through here. Unknown fields are dropped, sizes are
 * capped, and anything that cannot be repaired throws.
 */

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

function str(x: unknown, max = 160, fallback = ""): string {
  if (typeof x === "number" && Number.isFinite(x)) x = String(x);
  if (typeof x !== "string") return fallback;
  const s = x.replace(/\s+/g, " ").trim();
  return s.slice(0, max) || fallback;
}

function list(x: unknown, max: number): unknown[] {
  return Array.isArray(x) ? x.slice(0, max) : [];
}

function names(x: unknown, max = 40): string[] {
  const out: string[] = [];
  for (const n of list(x, max)) {
    const s = str(n, 40);
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

function id(x: unknown): string {
  const s = typeof x === "string" ? x.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) : "";
  return s || uid();
}

function money(x: unknown): number {
  const n = typeof x === "string" ? parseFloat(x.replace(/[^0-9.-]/g, "")) : Number(x);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n * 100) / 100, 10_000_000);
}

export function normalizeTool(raw: unknown): Tool {
  if (!isObj(raw)) throw new Error("Tool is not an object");
  const type = raw.type;
  if (typeof type !== "string" || !TOOL_TYPES.includes(type as Tool["type"])) {
    throw new Error(`Unknown tool type: ${String(type).slice(0, 30)}`);
  }
  const base = {
    id: id(raw.id),
    title: str(raw.title, 80, "Untitled"),
    by: str(raw.by, 40) || undefined,
    prompt: str(raw.prompt, 200) || undefined,
  };

  switch (type) {
    case "itinerary": {
      const days: ItineraryDay[] = list(raw.days, 14)
        .filter(isObj)
        .map((d, i) => ({
          id: id(d.id),
          label: str(d.label, 60, `Day ${i + 1}`),
          items: list(d.items, 30)
            .filter(isObj)
            .map((it) => ({ id: id(it.id), time: str(it.time, 24), text: str(it.text, 160) }))
            .filter((it) => it.text),
        }));
      if (days.length === 0) throw new Error("Itinerary has no days");
      return { ...base, type, days };
    }
    case "poll": {
      const options: PollOption[] = list(raw.options, 12)
        .map((o) => (typeof o === "string" ? { label: o } : o))
        .filter(isObj)
        .map((o) => ({ id: id(o.id), label: str(o.label, 80), votes: names(o.votes) }))
        .filter((o) => o.label);
      if (options.length < 2) throw new Error("Poll needs at least two options");
      return { ...base, type, question: str(raw.question, 140, base.title), options };
    }
    case "expenses": {
      const people = names(raw.people, 30);
      const items: Expense[] = [];
      for (const e of list(raw.items, 80).filter(isObj)) {
        const paidBy = str(e.paidBy, 40);
        const label = str(e.label, 80, "Expense");
        const amount = money(e.amount);
        if (!paidBy || amount <= 0) continue;
        if (!people.includes(paidBy)) people.push(paidBy);
        let split = names(e.split);
        for (const n of split) if (!people.includes(n)) people.push(n);
        if (split.length === 0) split = [...people];
        items.push({ id: id(e.id), label, amount, paidBy, split });
      }
      if (people.length < 2) throw new Error("Expense split needs at least two people");
      return { ...base, type, currency: str(raw.currency, 4, "$"), people, items };
    }
    case "bracket": {
      const entrants = names(raw.entrants, 32);
      if (entrants.length < 2) throw new Error("Bracket needs at least two entrants");
      const winners: Record<string, string> = {};
      if (isObj(raw.winners)) {
        for (const [k, v] of Object.entries(raw.winners)) {
          if (/^\d{1,2}-\d{1,2}$/.test(k) && typeof v === "string" && entrants.includes(v)) winners[k] = v;
        }
      }
      return { ...base, type, entrants, winners };
    }
    case "seating": {
      const tables: SeatTable[] = list(raw.tables, 24)
        .filter(isObj)
        .map((t, i) => ({
          id: id(t.id),
          name: str(t.name, 40, `Table ${i + 1}`),
          seats: Math.max(1, Math.min(24, Math.round(Number(t.seats) || 4))),
        }));
      if (tables.length === 0) throw new Error("Seating chart has no tables");
      const fill: Record<string, number> = {};
      const guests: Guest[] = list(raw.guests, 200)
        .map((g) => (typeof g === "string" ? { name: g } : g))
        .filter(isObj)
        .map((g) => {
          const ref = g.tableId ?? g.table;
          const t =
            tables.find((t) => t.id === ref) ??
            tables.find((t) => typeof ref === "string" && t.name.toLowerCase() === ref.trim().toLowerCase());
          let tableId: string | null = t ? t.id : null;
          if (tableId) {
            fill[tableId] = (fill[tableId] ?? 0) + 1;
            if (fill[tableId] > (t?.seats ?? 0)) tableId = null;
          }
          return { id: id(g.id), name: str(g.name, 40), tableId };
        })
        .filter((g) => g.name);
      return { ...base, type, tables, guests };
    }
    case "checklist": {
      const items: CheckItem[] = list(raw.items, 60)
        .map((c) => (typeof c === "string" ? { text: c } : c))
        .filter(isObj)
        .map((c) => ({
          id: id(c.id),
          text: str(c.text, 140),
          done: c.done === true,
          who: str(c.who, 40) || undefined,
        }))
        .filter((c) => c.text);
      if (items.length === 0) throw new Error("Checklist is empty");
      return { ...base, type, items };
    }
  }
  throw new Error("Unknown tool type");
}

export function normalizeSpace(raw: unknown): Space {
  if (!isObj(raw)) throw new Error("Not a space");
  const members: Member[] = list(raw.members, 40)
    .filter(isObj)
    .map((m, i) => ({
      id: id(m.id),
      name: str(m.name, 40),
      color: typeof m.color === "string" && /^#[0-9a-fA-F]{6}$/.test(m.color) ? m.color : colorFor(i),
    }))
    .filter((m) => m.name);
  const pins: Pin[] = list(raw.pins, 60)
    .filter(isObj)
    .map((p) => {
      const url = typeof p.url === "string" && /^https?:\/\//i.test(p.url) ? p.url.slice(0, 500) : undefined;
      return {
        id: id(p.id),
        kind: url ? ("link" as const) : ("note" as const),
        text: str(p.text, 280),
        url,
        by: str(p.by, 40) || undefined,
      };
    })
    .filter((p) => p.text);
  const tools: Tool[] = [];
  for (const t of list(raw.tools, 40)) {
    try {
      tools.push(normalizeTool(t));
    } catch {
      /* skip broken tools rather than losing the whole space */
    }
  }
  return {
    v: 1,
    id: id(raw.id),
    title: str(raw.title, 80, "Untitled space"),
    subtitle: str(raw.subtitle, 140),
    members,
    pins,
    tools,
  };
}

/** Pull the first JSON object out of a model reply (tolerates code fences / stray prose). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in reply");
  return JSON.parse(text.slice(start, end + 1));
}
