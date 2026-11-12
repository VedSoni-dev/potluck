export type Member = { id: string; name: string; color: string };

export type Pin = {
  id: string;
  kind: "link" | "note";
  text: string;
  url?: string;
  by?: string;
};

type Base = {
  id: string;
  title: string;
  /** who asked for it */
  by?: string;
  /** the sentence that produced it */
  prompt?: string;
};

export type ItineraryItem = { id: string; time: string; text: string };
export type ItineraryDay = { id: string; label: string; items: ItineraryItem[] };
export type ItineraryTool = Base & { type: "itinerary"; days: ItineraryDay[] };

export type PollOption = { id: string; label: string; votes: string[] };
export type PollTool = Base & { type: "poll"; question: string; options: PollOption[] };

export type Expense = {
  id: string;
  label: string;
  amount: number;
  paidBy: string;
  split: string[];
};
export type ExpensesTool = Base & {
  type: "expenses";
  currency: string;
  people: string[];
  items: Expense[];
};

export type BracketTool = Base & {
  type: "bracket";
  entrants: string[];
  /** match key "round-index" -> winner name */
  winners: Record<string, string>;
};

export type SeatTable = { id: string; name: string; seats: number };
export type Guest = { id: string; name: string; tableId: string | null };
export type SeatingTool = Base & { type: "seating"; tables: SeatTable[]; guests: Guest[] };

export type CheckItem = { id: string; text: string; done: boolean; who?: string };
export type ChecklistTool = Base & { type: "checklist"; items: CheckItem[] };

export type Tool =
  | ItineraryTool
  | PollTool
  | ExpensesTool
  | BracketTool
  | SeatingTool
  | ChecklistTool;

export type ToolType = Tool["type"];

export type Space = {
  v: 1;
  id: string;
  title: string;
  subtitle: string;
  members: Member[];
  pins: Pin[];
  tools: Tool[];
};

export const TOOL_TYPES: ToolType[] = [
  "itinerary",
  "poll",
  "expenses",
  "bracket",
  "seating",
  "checklist",
];

export const TOOL_LABEL: Record<ToolType, string> = {
  itinerary: "Itinerary",
  poll: "Poll",
  expenses: "Expense split",
  bracket: "Bracket",
  seating: "Seating chart",
  checklist: "Checklist",
};
