import type { Choice } from "./publik"; // type only: no server code reaches the browser

/** Which AI the agent bar uses, and the words that say so. */
export type AiStatus = { on: boolean; via: "publik" | "own" | null; label: string };

export function aiStatus(choice: Choice | null, apiKey: string, model: string): AiStatus {
  // "Connect your plan" at Sign in with publik: /api/agent uses this browser's publik key (sealed cookie).
  if (choice === "publik") return { on: true, via: "publik", label: "AI on · your publik plan" };
  if (apiKey) return { on: true, via: "own", label: `AI on · your key · ${model}` };
  return {
    on: false,
    via: null,
    label:
      choice === "own_key"
        ? "AI is off · add your Anthropic key in settings, or switch to your publik plan"
        : "AI is off · turn it on in settings with your publik plan or your own key",
  };
}

/** "Ana", "Ana and Ben", "Ana, Ben and Cara"; more than four reads "all 6 of us". */
export function listNames(names: string[]): string {
  if (names.length > 4) return `all ${names.length} of us`;
  if (names.length <= 1) return names[0] ?? "everyone";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Example asks for a fresh plan, written with the group's real names. They also work as starter matches. */
export function examplePrompts(people: string[]): string[] {
  const n = people.length;
  if (n < 2) {
    return [
      "a poll for dinner: tapas, ramen or cook in",
      "split $600 for the place between everyone",
      "who brings what for the first night",
    ];
  }
  const who = listNames(people);
  return [
    `split $600 for the place between ${who}`,
    `who sleeps where for ${who}: ${Math.ceil(n / 2)} rooms of 2`,
    "a poll for dinner: tapas, ramen or cook in",
  ];
}
