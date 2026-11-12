"use client";

import { Check, Copy, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SHARE_PARAM, encodeSpace } from "@/lib/share";
import { DEFAULT_MODEL } from "@/lib/store";
import { TEMPLATES, type Template } from "@/lib/templates";
import type { Space } from "@/lib/types";
import { PublikChoice, usePublik } from "./PublikGate";
import { TOOL_HUE, TOOL_ICON } from "./ToolCard";
import { Modal, btnGhost, btnPrimary, field } from "./ui";

export function SettingsDialog({
  apiKey,
  model,
  onSave,
  onClose,
}: {
  apiKey: string;
  model: string;
  onSave: (key: string, model: string) => void;
  onClose: () => void;
}) {
  const [k, setK] = useState(apiKey);
  const [m, setM] = useState(model);
  const [show, setShow] = useState(false);
  // The choice made at Sign in with publik; <PublikChoice /> below changes it.
  const { ready, usesAi, choice } = usePublik();
  const viaPublik = choice === "publik";
  return (
    <Modal title="Agent settings" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(k.trim(), m.trim());
        }}
      >
        {ready && usesAi && (
          <div className="rounded-xl border border-line bg-bg-2/40 p-3">
            <PublikChoice />
          </div>
        )}
        <label className={`block space-y-1.5 ${viaPublik ? "opacity-75" : ""}`}>
          <span className="text-sm font-medium">
            Anthropic API key {viaPublik && <span className="font-normal text-muted">(used only with My own key)</span>}
          </span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={k}
              onChange={(e) => setK(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              className={`${field} pr-10 font-mono`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
              aria-label={show ? "Hide key" : "Show key"}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <span className="block text-xs leading-relaxed text-muted">
            {viaPublik
              ? "Your publik plan pays for AI right now, so no key is needed. "
              : "With My own key, @potluck needs this to build custom tools. "}
            Stored only in this browser (localStorage). Each request sends it to this app&apos;s <code>/api/agent</code>{" "}
            route, which forwards it to Anthropic for that one call. It is never saved or logged on the server. With no
            AI turned on, requests match the starter templates.
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Model <span className="font-normal text-muted">({viaPublik ? "your key only; publik plan uses publik-balanced" : "your key"})</span>
          </span>
          <input value={m} onChange={(e) => setM(e.target.value)} placeholder={DEFAULT_MODEL} className={`${field} font-mono`} spellCheck={false} />
        </label>
        <div className="flex items-center justify-between gap-2 pt-1">
          {apiKey ? (
            <button type="button" onClick={() => onSave("", m.trim())} className={`${btnGhost} text-bad`}>
              Remove key
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className={btnPrimary}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function TemplatesDialog({ onPick, onClose }: { onPick: (t: Template) => void; onClose: () => void }) {
  return (
    <Modal title="Starters" onClose={onClose} wide>
      <p className="-mt-2 mb-4 text-sm text-muted">Drop one on the table, then edit it in place. Works without a key.</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const Icon = TOOL_ICON[t.type];
          const hue = TOOL_HUE[t.type];
          return (
            <button
              key={t.key}
              onClick={() => onPick(t)}
              className="flex items-start gap-3 rounded-xl border border-line p-3 text-left transition hover:border-line-2 hover:bg-bg-2/60"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in oklab, ${hue} 14%, transparent)`, color: hue }}
              >
                <Icon size={17} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{t.name}</span>
                <span className="block text-xs leading-snug text-muted">{t.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export function ShareDialog({ space, onClose }: { space: Space; onClose: () => void }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    encodeSpace(space)
      .then((token) => {
        if (alive) setLink(`${window.location.origin}${window.location.pathname}#${SHARE_PARAM}${token}`);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [space]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal title="Share this space" onClose={onClose}>
      {failed ? (
        <p className="text-sm text-bad">Couldn&apos;t build a link in this browser. Use Export as JSON instead.</p>
      ) : !link ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle size={15} className="animate-spin" /> Packing the space into a link…
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input readOnly value={link} onFocus={(e) => e.target.select()} className={`${field} font-mono text-xs`} aria-label="Share link" />
            <button onClick={copy} className={`${btnPrimary} shrink-0`}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            The whole space is compressed into the link itself ({(link.length / 1024).toFixed(1)} KB), after the #, so it
            never touches a server. Paste it in your group chat: friends open the same space and can vote, split and drag.
          </p>
          <p className="rounded-xl bg-bg-2 px-3 py-2 text-xs leading-relaxed text-ink-2">
            Heads up: this is a snapshot, not live multiplayer. Each person&apos;s edits stay on their device until they
            share a fresh link back.
          </p>
        </div>
      )}
    </Modal>
  );
}
