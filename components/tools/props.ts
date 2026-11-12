import type { Tool } from "@/lib/types";

export type ToolProps<T extends Tool> = {
  tool: T;
  onChange: (next: T) => void;
  /** name of the person using this browser */
  me: string;
  /** names of everyone in the space */
  people: string[];
  colorOf: (name: string) => string;
};
