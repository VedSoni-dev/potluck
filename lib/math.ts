import type { BracketTool, ExpensesTool } from "./types";

/* ---------- expenses: who owes whom ---------- */

export type Transfer = { from: string; to: string; amount: number };

export function settle(tool: ExpensesTool) {
  const net: Record<string, number> = {}; // cents, + means is owed money
  for (const p of tool.people) net[p] = 0;
  let total = 0;
  for (const e of tool.items) {
    const cents = Math.round(e.amount * 100);
    const split = e.split.length ? e.split : tool.people;
    total += cents;
    net[e.paidBy] = (net[e.paidBy] ?? 0) + cents;
    const share = Math.floor(cents / split.length);
    let rest = cents - share * split.length;
    for (const p of split) {
      const extra = rest > 0 ? 1 : 0;
      rest -= extra;
      net[p] = (net[p] ?? 0) - share - extra;
    }
  }
  const debtors = Object.entries(net)
    .filter(([, v]) => v < 0)
    .map(([k, v]) => ({ k, v: -v }))
    .sort((a, b) => b.v - a.v);
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v);
  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v);
    if (amt > 0) transfers.push({ from: debtors[i].k, to: creditors[j].k, amount: amt / 100 });
    debtors[i].v -= amt;
    creditors[j].v -= amt;
    if (debtors[i].v === 0) i++;
    if (creditors[j].v === 0) j++;
  }
  const netDollars: Record<string, number> = {};
  for (const [k, v] of Object.entries(net)) netDollars[k] = v / 100;
  return { total: total / 100, net: netDollars, transfers };
}

export function fmtMoney(n: number, currency = "$"): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : ""}${currency}${s}`;
}

/* ---------- bracket ---------- */

export type Match = {
  key: string;
  round: number;
  a: string | null;
  b: string | null;
  winner: string | null;
  bye: boolean;
};

export function buildBracket(tool: BracketTool) {
  const n = tool.entrants.length;
  const size = Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, n))));
  const byes = size - n;
  const first: [string | null, string | null][] = [];
  let k = 0;
  for (let m = 0; m < size / 2; m++) {
    if (m < byes) first.push([tool.entrants[k++] ?? null, null]);
    else first.push([tool.entrants[k++] ?? null, tool.entrants[k++] ?? null]);
  }
  const rounds: Match[][] = [];
  let prev: Match[] = [];
  const total = Math.log2(size);
  for (let r = 0; r < total; r++) {
    const count = size / 2 ** (r + 1);
    const cur: Match[] = [];
    for (let m = 0; m < count; m++) {
      const key = `${r}-${m}`;
      const a = r === 0 ? first[m][0] : prev[2 * m].winner;
      const b = r === 0 ? first[m][1] : prev[2 * m + 1].winner;
      const bye = r === 0 && (a === null || b === null);
      let winner: string | null = null;
      if (bye) winner = a ?? b;
      else if (a && b) {
        const w = tool.winners[key];
        if (w === a || w === b) winner = w;
      }
      cur.push({ key, round: r, a, b, winner, bye });
    }
    rounds.push(cur);
    prev = cur;
  }
  const champion = rounds[rounds.length - 1][0]?.winner ?? null;
  return { rounds, champion, size };
}

export function roundName(r: number, total: number): string {
  const fromEnd = total - r;
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semis";
  if (fromEnd === 3) return "Quarters";
  return `Round ${r + 1}`;
}
