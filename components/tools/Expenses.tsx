"use client";

import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { uid } from "@/lib/id";
import { fmtMoney, settle } from "@/lib/math";
import type { ExpensesTool } from "@/lib/types";
import { Avatar, miniInput } from "../ui";
import type { ToolProps } from "./props";

export function Expenses({ tool, onChange, me, colorOf }: ToolProps<ExpensesTool>) {
  const { total, transfers, net } = settle(tool);
  const cur = tool.currency;
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(tool.people.includes(me) ? me : tool.people[0]);
  const [open, setOpen] = useState(false);
  const [split, setSplit] = useState<string[]>(tool.people);

  function add() {
    const amt = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!label.trim() || !Number.isFinite(amt) || amt <= 0) return;
    onChange({
      ...tool,
      items: [
        ...tool.items,
        {
          id: uid(),
          label: label.trim().slice(0, 80),
          amount: Math.round(amt * 100) / 100,
          paidBy,
          split: split.length ? split : tool.people,
        },
      ],
    });
    setLabel("");
    setAmount("");
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted">Total spent</div>
          <div className="font-display text-2xl font-semibold tabular-nums tracking-tight">{fmtMoney(total, cur)}</div>
        </div>
        <div className="text-right text-xs text-muted">
          {tool.items.length} expenses · {tool.people.length} people
        </div>
      </div>

      <div className="rounded-xl border border-line bg-bg/60 p-2.5">
        <div className="mb-1.5 px-0.5 text-xs font-semibold uppercase tracking-wider text-muted">Settle up</div>
        {transfers.length === 0 ? (
          <p className="px-0.5 text-sm text-muted">Everyone is square.</p>
        ) : (
          <ul className="space-y-1.5">
            {transfers.map((t) => (
              <li key={`${t.from}-${t.to}`} className="flex items-center gap-2 text-sm">
                <Avatar name={t.from} color={colorOf(t.from)} size={20} />
                <span className="font-medium">{t.from}</span>
                <ArrowRight size={14} className="text-muted" />
                <Avatar name={t.to} color={colorOf(t.to)} size={20} />
                <span className="font-medium">{t.to}</span>
                <span className="ml-auto font-semibold tabular-nums">{fmtMoney(t.amount, cur)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="divide-y divide-line text-sm">
        {tool.items.map((e) => (
          <li key={e.id} className="group flex items-center gap-2 py-1.5">
            <Avatar name={e.paidBy} color={colorOf(e.paidBy)} size={18} />
            <span className="min-w-0 flex-1 truncate">
              {e.label}
              <span className="text-muted">
                {" "}
                · {e.split.length === tool.people.length ? "everyone" : e.split.join(", ")}
              </span>
            </span>
            <span className="tabular-nums">{fmtMoney(e.amount, cur)}</span>
            <button
              onClick={() => onChange({ ...tool, items: tool.items.filter((x) => x.id !== e.id) })}
              className="rounded p-0.5 text-muted opacity-0 transition hover:text-bad group-hover:opacity-100 focus:opacity-100"
              aria-label={`Remove ${e.label}`}
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <form
          className="space-y-2 rounded-xl border border-line p-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <div className="flex gap-1.5">
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What for?" className={miniInput} />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className={`${miniInput} max-w-24 tabular-nums`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted">Paid by</span>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="rounded-lg border border-line bg-card px-1.5 py-1">
              {tool.people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <span className="ml-1 text-muted">split with</span>
            {tool.people.map((p) => {
              const on = split.includes(p);
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setSplit(on ? split.filter((x) => x !== p) : [...split, p])}
                  className={`rounded-full border px-2 py-0.5 ${on ? "border-accent bg-accent-soft text-ink" : "border-line text-muted"}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-1.5">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2.5 py-1 text-xs text-muted hover:bg-bg-2">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-bg">
              Add expense
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSplit(tool.people);
              setPaidBy(tool.people.includes(me) ? me : tool.people[0]);
              setOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm text-muted hover:bg-bg-2 hover:text-ink"
          >
            <Plus size={15} /> Add expense
          </button>
          {net[me] !== undefined && (
            <span className={`text-xs font-medium ${net[me] < 0 ? "text-bad" : "text-good"}`}>
              {net[me] < 0 ? `you owe ${fmtMoney(-net[me], cur)}` : net[me] > 0 ? `you're owed ${fmtMoney(net[me], cur)}` : "you're square"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
