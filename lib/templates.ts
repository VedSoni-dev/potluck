import { uid } from "./id";
import type { Tool, ToolType } from "./types";

export type Template = {
  key: string;
  type: ToolType;
  name: string;
  blurb: string;
  make: (people: string[], prompt?: string) => Tool;
};

/** The group, or (in a plan that has only you so far) you plus placeholders to rename. */
const crew = (people: string[]) =>
  people.length >= 2 ? people : [people[0] ?? "You", "Friend 2", "Friend 3", "Friend 4"];

function numberNear(prompt: string | undefined, words: RegExp): number | undefined {
  if (!prompt) return undefined;
  const m = prompt.match(new RegExp(`(\\d{1,3})\\s*(?:${words.source})`, "i"));
  return m ? parseInt(m[1], 10) : undefined;
}


/** "a poll for friday's hike: easy, medium or summit" -> question + options */
function parseChoices(prompt?: string) {
  if (!prompt) return null;
  const m = prompt.match(/^(.*?)[:\-–]\s*(.+)$/);
  if (!m) return null;
  const options = m[2]
    .split(/\s*(?:,|\bor\b|\/)\s*/i)
    .map((o) => o.trim().replace(/[?.!]+$/, ""))
    .filter(Boolean)
    .slice(0, 8)
    .map((o) => o[0].toUpperCase() + o.slice(1));
  if (options.length < 2) return null;
  const topic = m[1].replace(/^(a|an|the)\s+/i, "").replace(/\b(poll|vote)\b\s*(for|on|about)?\s*/i, "").trim();
  const title = topic ? topic[0].toUpperCase() + topic.slice(1, 60) : "Quick poll";
  return { title, question: topic ? `${title}?` : "What do we pick?", options };
}

/** "split $340 for the cabin hot tub between everyone" -> "Cabin hot tub" */
function cleanLabel(prompt: string, amountText: string) {
  const s = prompt
    .replace(amountText, "")
    .replace(/\b(split|divide|share)\b/gi, "")
    .replace(/\b(between|among|with)\b.*$/i, "")
    .replace(/^\s*(for|on)\s+/i, "")
    .replace(/^\s*(the|a|an)\s+/i, "")
    .trim();
  return s ? s[0].toUpperCase() + s.slice(1, 60) : "";
}

export const TEMPLATES: Template[] = [
  {
    key: "weekend",
    type: "itinerary",
    name: "Weekend itinerary",
    blurb: "Days with times. Add stops as plans firm up.",
    make: () => ({
      id: uid(),
      type: "itinerary",
      title: "Weekend plan",
      days: [
        {
          id: uid(),
          label: "Friday",
          items: [
            { id: uid(), time: "6:00 PM", text: "Leave town" },
            { id: uid(), time: "9:00 PM", text: "Check in, late snack" },
          ],
        },
        {
          id: uid(),
          label: "Saturday",
          items: [
            { id: uid(), time: "9:00 AM", text: "Breakfast together" },
            { id: uid(), time: "1:00 PM", text: "Main activity" },
            { id: uid(), time: "7:30 PM", text: "Group dinner" },
          ],
        },
        {
          id: uid(),
          label: "Sunday",
          items: [{ id: uid(), time: "11:00 AM", text: "Check out, head home" }],
        },
      ],
    }),
  },
  {
    key: "dinner-poll",
    type: "poll",
    name: "Quick poll",
    blurb: "Everyone taps a choice. Leader floats to the top.",
    make: (_p, prompt) => {
      const parsed = parseChoices(prompt);
      if (parsed) {
        return {
          id: uid(),
          type: "poll",
          title: parsed.title,
          question: parsed.question,
          options: parsed.options.map((label) => ({ id: uid(), label, votes: [] })),
        };
      }
      return {
        id: uid(),
        type: "poll",
        title: "Dinner poll",
        question: prompt && prompt.trim().endsWith("?") ? prompt.trim() : "Where should we eat?",
        options: [
          { id: uid(), label: "Cook together", votes: [] },
          { id: uid(), label: "Try somewhere new", votes: [] },
          { id: uid(), label: "Order in", votes: [] },
        ],
      };
    },
  },
  {
    key: "split",
    type: "expenses",
    name: "Expense splitter",
    blurb: "Log who paid. It works out who owes whom, to the cent.",
    make: (people, prompt) => {
      const p = crew(people);
      const amt = prompt?.match(/\$\s?(\d[\d,]*(?:\.\d{1,2})?)/);
      const items = amt
        ? [
            {
              id: uid(),
              label: cleanLabel(prompt!, amt[0]) || "Shared cost",
              amount: parseFloat(amt[1].replace(/,/g, "")),
              paidBy: p[0],
              split: p,
            },
          ]
        : [
            { id: uid(), label: "Place to stay", amount: 600, paidBy: p[0], split: p },
            { id: uid(), label: "Groceries", amount: 120, paidBy: p[1], split: p },
          ];
      return { id: uid(), type: "expenses", title: "Shared costs", currency: "$", people: p, items };
    },
  },
  {
    key: "bracket",
    type: "bracket",
    name: "Tournament bracket",
    blurb: "Single elimination. Tap a name to send them through.",
    make: (people, prompt) => {
      const n = numberNear(prompt, /teams?|players?|people|entrants?/);
      const entrants =
        n && n >= 2
          ? Array.from({ length: Math.min(32, n) }, (_, i) => `Team ${i + 1}`)
          : crew(people);
      return { id: uid(), type: "bracket", title: "Tournament", entrants, winners: {} };
    },
  },
  {
    key: "seating",
    type: "seating",
    name: "Seating chart",
    blurb: "Tables with seats. Drag name badges between them.",
    make: (people, prompt) => {
      const tablesN = Math.min(12, numberNear(prompt, /tables?|rooms?|cars?/) ?? 3);
      const ofN = prompt?.match(/of\s*(\d{1,2})/i);
      const seats = Math.min(24, Math.max(1, ofN ? parseInt(ofN[1], 10) : 4));
      const unit = /rooms?|sleep|beds?/i.test(prompt ?? "") ? "Room" : /cars?\b/i.test(prompt ?? "") ? "Car" : "Table";
      const tables = Array.from({ length: tablesN }, (_, i) => ({ id: uid(), name: `${unit} ${i + 1}`, seats }));
      const guests = crew(people).map((name) => ({ id: uid(), name, tableId: null }));
      const title = unit === "Room" ? "Who sleeps where" : unit === "Car" ? "Who rides with whom" : "Seating chart";
      return { id: uid(), type: "seating", title, tables, guests };
    },
  },
  {
    key: "bring",
    type: "checklist",
    name: "Who brings what",
    blurb: "A shared list with a name on every item.",
    make: (people) => {
      const p = crew(people);
      const things = ["Drinks", "Snacks", "Plates + cups", "Speaker", "Ice", "Dessert"];
      return {
        id: uid(),
        type: "checklist",
        title: "Who brings what",
        items: things.map((text, i) => ({ id: uid(), text, done: false, who: p[i % p.length] })),
      };
    },
  },
  {
    key: "chores",
    type: "checklist",
    name: "Chore rota",
    blurb: "House jobs with owners. Tick them off as they get done.",
    make: (people) => {
      const p = crew(people);
      const jobs = ["Dishes", "Take out trash", "Wipe kitchen", "Vacuum", "Groceries run", "Laundry"];
      return {
        id: uid(),
        type: "checklist",
        title: "Chores this week",
        items: jobs.map((text, i) => ({ id: uid(), text, done: false, who: p[i % p.length] })),
      };
    },
  },
  {
    key: "date-poll",
    type: "poll",
    name: "Pick a date",
    blurb: "Throw out a few dates, see which one works for most.",
    make: () => ({
      id: uid(),
      type: "poll",
      title: "Pick a date",
      question: "Which weekend works?",
      options: [
        { id: uid(), label: "First weekend", votes: [] },
        { id: uid(), label: "Second weekend", votes: [] },
        { id: uid(), label: "Third weekend", votes: [] },
      ],
    }),
  },
];

const RULES: [RegExp, string][] = [
  [/split|expense|owe|cost|bill|paid|pay|budget|money|\$/i, "split"],
  [/bracket|tournament|knockout|playoff|\bcup\b|elimination|versus|\bvs\b/i, "bracket"],
  [/seat|table|sleep|room|bed|carpool|car pool|who rides|cars?\b/i, "seating"],
  [/date|when|weekend works/i, "date-poll"],
  [/poll|vote|decide|choose|pick|which|where should|\?/i, "dinner-poll"],
  [/itinerar|schedule|agenda|timeline|plan|day|trip/i, "weekend"],
  [/chore|clean|rota|house/i, "chores"],
  [/check|list|pack|bring|todo|to-do|task|potluck/i, "bring"],
];

/** No-key mode: map a sentence to the closest starter template. */
export function matchTemplate(prompt: string): Template | null {
  for (const [re, key] of RULES) {
    if (re.test(prompt)) return TEMPLATES.find((t) => t.key === key) ?? null;
  }
  return null;
}
