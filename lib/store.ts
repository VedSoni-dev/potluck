/* localStorage helpers that never throw (private mode, blocked storage, SSR). */

export const KEYS = {
  space: "potluck:space",
  me: "potluck:me",
  apiKey: "potluck:anthropic-key",
  model: "potluck:model",
  theme: "potluck:theme",
  /** the how-to card in a new plan: {"hidden":bool,"touched":bool,"shared":bool} */
  guide: "potluck:guide",
} as const;

export function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the app still works for this tab */
  }
}

export const DEFAULT_MODEL = "claude-sonnet-5-5";
