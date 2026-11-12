"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { initials } from "@/lib/id";

export function Avatar({
  name,
  color,
  size = 24,
  ring = false,
}: {
  name: string;
  color?: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${
        ring ? "ring-2 ring-card" : ""
      }`}
      style={{ width: size, height: size, background: color ?? "#776d60", fontSize: Math.round(size * 0.4) }}
    >
      {initials(name)}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`pop max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card p-5 shadow-card sm:rounded-2xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-md"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50";
export const btnPrimary = `${btn} bg-ink text-bg hover:bg-ink-2`;
export const btnAccent = `${btn} bg-accent text-accent-ink hover:opacity-90`;
export const btnGhost = `${btn} text-ink-2 hover:bg-bg-2`;
export const btnOutline = `${btn} border border-line bg-card text-ink hover:border-line-2 hover:bg-bg-2`;
export const field =
  "w-full rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
export const miniInput =
  "min-w-0 flex-1 rounded-lg border border-transparent bg-bg-2/70 px-2.5 py-1.5 text-sm outline-none placeholder:text-muted focus:border-line-2 focus:bg-card";

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <circle cx="16" cy="17" r="8.5" fill="none" className="stroke-bg" strokeWidth="2.4" />
      <circle cx="16" cy="17" r="2.6" className="fill-accent" />
      <circle cx="11" cy="7.5" r="2" className="fill-bg" />
      <circle cx="16" cy="6" r="2" className="fill-accent" />
      <circle cx="21" cy="7.5" r="2" className="fill-bg" />
    </svg>
  );
}
