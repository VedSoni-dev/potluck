export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const MEMBER_COLORS = [
  "#d9480f",
  "#5f3dc4",
  "#0b7285",
  "#c2255c",
  "#2b8a3e",
  "#e67700",
  "#1864ab",
  "#862e9c",
];

export function colorFor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
