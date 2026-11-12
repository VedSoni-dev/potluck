"use client";

import {
  Download,
  Ellipsis,
  FilePlus2,
  Link2,
  LayoutTemplate,
  Moon,
  RotateCcw,
  Settings,
  Share2,
  StickyNote,
  Sun,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { demoSpace } from "@/lib/demo";
import { MEMBER_COLORS, colorFor, uid } from "@/lib/id";
import { SHARE_PARAM, decodeSpace } from "@/lib/share";
import { DEFAULT_MODEL, KEYS, read, write } from "@/lib/store";
import { TEMPLATES, matchTemplate, type Template } from "@/lib/templates";
import type { Space, Tool } from "@/lib/types";
import { normalizeSpace, normalizeTool } from "@/lib/validate";
import { AgentBar } from "./AgentBar";
import { SettingsDialog, ShareDialog, TemplatesDialog } from "./Dialogs";
import { usePublik } from "./PublikGate";
import { ToolCard } from "./ToolCard";
import { Avatar, btnAccent, btnGhost, btnOutline, miniInput } from "./ui";

type Toast = { text: string; action?: { label: string; run: () => void } };

function hashColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}

export default function App() {
  const [space, setSpace] = useState<Space>(demoSpace);
  const [me, setMe] = useState("Maya");
  const [loaded, setLoaded] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [dark, setDark] = useState(false);
  const [modal, setModal] = useState<null | "settings" | "templates" | "share">(null);
  const [menu, setMenu] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("");
  const [error, setErrorState] = useState<{ text: string; topUpUrl?: string }>({ text: "" });
  const setError = (text: string, topUpUrl?: string) => setErrorState({ text, topUpUrl });
  const [target, setTarget] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [banner, setBanner] = useState("");
  const [pinDraft, setPinDraft] = useState("");
  const [memberDraft, setMemberDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Chosen at Sign in with publik ("Connect your plan"), changeable in settings: AI then runs on publik API.
  const publik = usePublik();
  const viaPublik = publik.choice === "publik";
  const aiOn = viaPublik || !!apiKey;

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  /* ---------- load ---------- */
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setApiKey(read(KEYS.apiKey) ?? "");
    setModel(read(KEYS.model) || DEFAULT_MODEL);
    const storedMe = read(KEYS.me);

    const adopt = (s: Space) => {
      setSpace(s);
      const names = s.members.map((m) => m.name);
      setMe(storedMe && names.includes(storedMe) ? storedMe : (names[0] ?? "You"));
    };

    (async () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith(SHARE_PARAM)) {
        try {
          const s = await decodeSpace(hash.slice(SHARE_PARAM.length));
          adopt(s);
          setBanner(`You opened a shared copy of “${s.title}”. Your edits stay on this device. Hit Share to send your version back.`);
        } catch {
          setBanner("That share link looks broken or cut off, so you're seeing your own space instead.");
          const raw = read(KEYS.space);
          if (raw) {
            try {
              adopt(normalizeSpace(JSON.parse(raw)));
            } catch {
              /* keep demo */
            }
          }
        }
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } else {
        const raw = read(KEYS.space);
        if (raw) {
          try {
            adopt(normalizeSpace(JSON.parse(raw)));
          } catch {
            /* corrupted storage: fall back to the demo */
          }
        }
      }
      setLoaded(true);
    })();
  }, []);

  /* ---------- save ---------- */
  useEffect(() => {
    if (loaded) write(KEYS.space, JSON.stringify(space));
  }, [space, loaded]);
  useEffect(() => {
    if (loaded) write(KEYS.me, me);
  }, [me, loaded]);

  const people = useMemo(() => space.members.map((m) => m.name), [space.members]);
  const colorOf = useCallback(
    (name: string) => space.members.find((m) => m.name === name)?.color ?? hashColor(name),
    [space.members],
  );
  const isDemo = space.id === "demo-ski-trip";

  /* ---------- mutations ---------- */
  const patch = (p: Partial<Space>) => setSpace((s) => ({ ...s, ...p }));
  const updateTool = (t: Tool) => setSpace((s) => ({ ...s, tools: s.tools.map((x) => (x.id === t.id ? t : x)) }));
  const removeTool = (id: string) => {
    const idx = space.tools.findIndex((t) => t.id === id);
    const removed = space.tools[idx];
    if (!removed) return;
    setSpace((s) => ({ ...s, tools: s.tools.filter((t) => t.id !== id) }));
    if (target === id) setTarget(null);
    showToast({
      text: `Removed “${removed.title}”.`,
      action: {
        label: "Undo",
        run: () =>
          setSpace((s) => {
            const tools = [...s.tools];
            tools.splice(Math.min(idx, tools.length), 0, removed);
            return { ...s, tools };
          }),
      },
    });
  };

  function addTool(tool: Tool) {
    setSpace((s) => ({ ...s, tools: [tool, ...s.tools] }));
    setFresh(tool.id);
    setTimeout(() => setFresh(null), 2200);
    requestAnimationFrame(() =>
      document.getElementById(`tool-${tool.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  function addFromTemplate(t: Template, fromPrompt?: string) {
    const tool = t.make(people, fromPrompt);
    addTool({ ...tool, by: me, prompt: fromPrompt });
    setModal(null);
  }

  async function ask() {
    const text = prompt.trim().replace(/^@potluck\b[:,]?\s*/i, "");
    if (!text) return;
    setError("");
    const current = target ? space.tools.find((t) => t.id === target) : undefined;

    if (!aiOn) {
      if (current) {
        setError("Changing a tool with a sentence needs AI: use your publik plan or add an Anthropic key in settings, or edit the tool directly.");
        return;
      }
      const tpl = matchTemplate(text);
      if (!tpl) {
        setError(
          "No starter matches that. Try words like poll, split, bracket, seating, itinerary or checklist, or turn on AI in settings for custom tools.",
        );
        return;
      }
      addFromTemplate(tpl, text);
      setPrompt("");
      showToast({
        text: `Added the “${tpl.name}” starter. Turn on AI in settings for custom tools.`,
        action: { label: "Settings", run: () => setModal("settings") },
      });
      return;
    }

    setBusy(true);
    setBusyText(text);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        // With publik, the server uses this browser's publik key (sealed cookie); the own key is not sent.
        headers: { "content-type": "application/json", ...(viaPublik ? {} : { "x-anthropic-key": apiKey }) },
        body: JSON.stringify({
          prompt: text,
          model,
          space: { title: space.title, subtitle: space.subtitle, members: people, pins: space.pins.map((p) => p.text) },
          current,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { tool?: unknown; error?: string; topUpUrl?: string };
      if (!res.ok || !data.tool) {
        // 402 from publik API: its message plus exactly one link, the top-up page.
        const topUp = res.status === 402 && data.topUpUrl?.startsWith("https://") ? data.topUpUrl : undefined;
        setError(data.error ?? `Something went wrong (${res.status}).`, topUp);
        return;
      }
      const tool = normalizeTool(data.tool);
      if (current) {
        const next = { ...tool, id: current.id, by: current.by, prompt: current.prompt } as Tool;
        updateTool(next);
        setTarget(null);
        setFresh(current.id);
        setTimeout(() => setFresh(null), 2200);
        showToast({ text: `Updated “${next.title}”.` });
      } else {
        addTool({ ...tool, by: me, prompt: text });
      }
      setPrompt("");
    } catch (e) {
      setError(e instanceof Error && e.message ? `Couldn't build that: ${e.message}` : "Couldn't reach the agent.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- space actions ---------- */
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    write(KEYS.theme, next ? "dark" : "light");
  }

  function newSpace() {
    setMenu(false);
    if (!confirm("Start a new empty space? It replaces the one on this device, so export first if you want to keep it."))
      return;
    const name = me || "You";
    setSpace({
      v: 1,
      id: uid(),
      title: "Untitled space",
      subtitle: "",
      members: [{ id: uid(), name, color: colorFor(0) }],
      pins: [],
      tools: [],
    });
    setMe(name);
    setTarget(null);
  }

  function loadDemo() {
    setMenu(false);
    if (!isDemo && !confirm("Load the sample space? It replaces the one on this device.")) return;
    setSpace(demoSpace());
    setMe("Maya");
    setTarget(null);
  }

  function exportJson() {
    setMenu(false);
    const blob = new Blob([JSON.stringify(space, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${space.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "space"}.potluck.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importJson(file: File) {
    try {
      const s = normalizeSpace(JSON.parse(await file.text()));
      setSpace(s);
      setMe(s.members[0]?.name ?? "You");
      showToast({ text: `Imported “${s.title}”.` });
    } catch {
      showToast({ text: "That file isn't a Potluck space." });
    }
  }

  function addPin() {
    const text = pinDraft.trim();
    if (!text) return;
    const urlMatch = text.match(/https?:\/\/\S+/i);
    const url = urlMatch?.[0];
    const label = url ? text.replace(url, "").trim() || url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60) : text;
    patch({ pins: [...space.pins, { id: uid(), kind: url ? "link" : "note", text: label.slice(0, 280), url, by: me }] });
    setPinDraft("");
  }

  function addMember() {
    const name = memberDraft.trim().slice(0, 40);
    if (!name || people.includes(name)) return setMemberDraft("");
    patch({ members: [...space.members, { id: uid(), name, color: colorFor(space.members.length) }] });
    setMemberDraft("");
  }

  const targetTool = target ? space.tools.find((t) => t.id === target) : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-3 px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2" aria-label="Potluck home">
            <Logo />
            <span className="font-display text-[19px] font-bold tracking-tight">potluck</span>
          </a>
          <span className="hidden h-5 w-px bg-line-2 sm:block" />
          <span className="hidden truncate text-sm text-muted sm:block">{space.title}</span>
          {isDemo && (
            <span className="hidden rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent md:inline">
              sample space
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="mr-1 hidden -space-x-1.5 md:flex">
              {space.members.slice(0, 6).map((m) => (
                <Avatar key={m.id} name={m.name} color={m.color} size={28} ring />
              ))}
              {space.members.length > 6 && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-2 text-[11px] font-semibold ring-2 ring-bg">
                  +{space.members.length - 6}
                </span>
              )}
            </div>
            <button onClick={() => setModal("templates")} className={`${btnGhost} max-sm:hidden`}>
              <LayoutTemplate size={16} /> Starters
            </button>
            <button onClick={() => setModal("share")} className={btnAccent}>
              <Share2 size={15} /> Share
            </button>
            <button onClick={toggleTheme} className={`${btnGhost} px-2`} aria-label={dark ? "Light mode" : "Dark mode"}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setModal("settings")} className={`${btnGhost} px-2`} aria-label="Settings">
              <Settings size={17} />
            </button>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className={`${btnGhost} px-2`} aria-label="Space menu" aria-expanded={menu}>
                <Ellipsis size={17} />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                  <div className="pop absolute right-0 z-50 mt-1 w-56 rounded-xl border border-line bg-card p-1 shadow-card">
                    <MenuItem icon={<FilePlus2 size={15} />} label="New empty space" onClick={newSpace} />
                    <MenuItem icon={<RotateCcw size={15} />} label="Load the sample space" onClick={loadDemo} />
                    <MenuItem icon={<Download size={15} />} label="Export as JSON" onClick={exportJson} />
                    <MenuItem
                      icon={<Upload size={15} />}
                      label="Import JSON"
                      onClick={() => {
                        setMenu(false);
                        fileRef.current?.click();
                      }}
                    />
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {banner && (
        <div className="border-b border-line bg-accent-soft/60 px-4 py-2 text-center text-sm">
          {banner}{" "}
          <button onClick={() => setBanner("")} className="ml-1 font-medium underline underline-offset-2">
            Got it
          </button>
        </div>
      )}

      <main className="canvas-dots flex-1">
        <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_288px]">
          {/* ---------- canvas ---------- */}
          <section className="min-w-0 space-y-5">
            <div className="space-y-1">
              <input
                value={space.title}
                onChange={(e) => patch({ title: e.target.value.slice(0, 80) })}
                className="w-full rounded-lg bg-transparent font-display text-3xl font-bold tracking-tight outline-none focus:bg-card/70 sm:text-[40px] sm:leading-[1.1]"
                aria-label="Space name"
              />
              <input
                value={space.subtitle}
                onChange={(e) => patch({ subtitle: e.target.value.slice(0, 140) })}
                placeholder="Dates, place, who's coming…"
                className="w-full rounded-lg bg-transparent text-[15px] text-muted outline-none placeholder:text-muted/70 focus:bg-card/70"
                aria-label="Space details"
              />
            </div>

            <AgentBar
              value={prompt}
              onChange={setPrompt}
              onSubmit={ask}
              busy={busy}
              hasKey={aiOn}
              model={viaPublik ? "publik API" : model}
              error={error.text}
              topUpUrl={error.topUpUrl}
              targetTitle={targetTool?.title ?? null}
              onClearTarget={() => setTarget(null)}
              onOpenSettings={() => setModal("settings")}
              onOpenTemplates={() => setModal("templates")}
            />

            <div className="grid grid-flow-dense grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {busy && !target && (
                <div className="rounded-2xl border border-accent/40 bg-card p-4 shadow-card">
                  <div className="mb-3 text-sm font-medium">
                    Building <span className="italic">“{busyText}”</span>…
                  </div>
                  <div className="space-y-2">
                    <div className="shimmer h-9 rounded-xl" />
                    <div className="shimmer h-9 rounded-xl" />
                    <div className="shimmer h-9 w-2/3 rounded-xl" />
                  </div>
                </div>
              )}
              {space.tools.map((t) => (
                <ToolCard
                  key={t.id}
                  tool={t}
                  onChange={updateTool}
                  onRemove={() => removeTool(t.id)}
                  onTweak={() => {
                    setTarget(target === t.id ? null : t.id);
                    setError("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  me={me}
                  people={people}
                  colorOf={colorOf}
                  fresh={fresh === t.id}
                  tweaking={target === t.id}
                />
              ))}
              {space.tools.length === 0 && !busy && (
                <div className="rounded-2xl border border-dashed border-line-2 bg-card/60 p-8 text-center md:col-span-2 xl:col-span-3">
                  <h3 className="font-display text-xl font-semibold">Nothing on the table yet</h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                    Ask @potluck for a tool above, or start from one of these.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {TEMPLATES.slice(0, 6).map((t) => (
                      <button key={t.key} onClick={() => addFromTemplate(t)} className={btnOutline}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ---------- side column ---------- */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">People · {space.members.length}</h3>
                <span className="text-xs text-muted">tap to be them</span>
              </div>
              <ul className="space-y-0.5">
                {space.members.map((m) => (
                  <li key={m.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => setMe(m.name)}
                      className={`flex flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left text-sm ${
                        me === m.name ? "bg-bg-2 font-semibold" : "hover:bg-bg-2/60"
                      }`}
                    >
                      <Avatar name={m.name} color={m.color} size={24} />
                      {m.name}
                      {me === m.name && (
                        <span className="ml-auto rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase text-bg">you</span>
                      )}
                    </button>
                    {me !== m.name && (
                      <button
                        onClick={() => patch({ members: space.members.filter((x) => x.id !== m.id) })}
                        className="rounded p-1 text-muted opacity-0 hover:text-bad group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <form
                className="mt-2 flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  addMember();
                }}
              >
                <input value={memberDraft} onChange={(e) => setMemberDraft(e.target.value)} placeholder="Add someone" className={miniInput} />
                <button type="submit" className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label="Add person">
                  <UserPlus size={15} />
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Board · links & notes</h3>
              <ul className="space-y-1.5">
                {space.pins.map((p) => (
                  <li key={p.id} className="group flex items-start gap-2 rounded-lg p-1 text-sm hover:bg-bg-2/60">
                    <span className="mt-0.5 text-muted">{p.url ? <Link2 size={14} /> : <StickyNote size={14} />}</span>
                    <span className="min-w-0 flex-1 leading-snug">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-line-2 underline-offset-2 hover:decoration-ink">
                          {p.text}
                        </a>
                      ) : (
                        p.text
                      )}
                      {p.by && <span className="text-muted"> · {p.by}</span>}
                    </span>
                    <button
                      onClick={() => patch({ pins: space.pins.filter((x) => x.id !== p.id) })}
                      className="rounded p-0.5 text-muted opacity-0 hover:text-bad group-hover:opacity-100 focus:opacity-100"
                      aria-label="Remove from board"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
                {space.pins.length === 0 && <li className="text-sm text-muted">Paste links, addresses, ideas. The agent reads these too.</li>}
              </ul>
              <form
                className="mt-2 flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  addPin();
                }}
              >
                <input value={pinDraft} onChange={(e) => setPinDraft(e.target.value)} placeholder="Paste a link or jot a note" className={miniInput} />
              </form>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        potluck · free & open source (MIT) · not affiliated with Google Tabletop · your space lives in this browser
      </footer>

      {toast && (
        <div className="pop fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-4 py-2.5 text-sm text-bg shadow-xl">
          <span>{toast.text}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.run();
                setToast(null);
              }}
              className="font-semibold text-accent-soft underline underline-offset-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {modal === "settings" && (
        <SettingsDialog
          apiKey={apiKey}
          model={model}
          onSave={(k, m) => {
            setApiKey(k);
            setModel(m || DEFAULT_MODEL);
            write(KEYS.apiKey, k || null);
            write(KEYS.model, m && m !== DEFAULT_MODEL ? m : null);
            setModal(null);
            setError("");
            showToast({
              text: k
                ? viaPublik
                  ? "Key saved in this browser. AI uses your publik plan until you pick My own key."
                  : "Key saved in this browser. Ask for anything."
                : viaPublik
                  ? "Key removed. AI still uses your publik plan."
                  : "Key removed. Back to demo mode.",
            });
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "templates" && <TemplatesDialog onPick={(t) => addFromTemplate(t)} onClose={() => setModal(null)} />}
      {modal === "share" && <ShareDialog space={space} onClose={() => setModal(null)} />}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-bg-2">
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}

function Logo() {
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
