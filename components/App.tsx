"use client";

import {
  ArrowRight,
  CircleHelp,
  Download,
  Ellipsis,
  Eye,
  FilePlus2,
  Link2,
  LayoutTemplate,
  Moon,
  Settings,
  Share2,
  StickyNote,
  Sun,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiStatus, examplePrompts, type AiStatus } from "@/lib/ai";
import { SAMPLE_ID, demoSpace } from "@/lib/demo";
import { MEMBER_COLORS, colorFor, uid } from "@/lib/id";
import { SHARE_PARAM, decodeSpace } from "@/lib/share";
import { DEFAULT_MODEL, KEYS, read, write } from "@/lib/store";
import { TEMPLATES, matchTemplate, type Template } from "@/lib/templates";
import type { Space, Tool } from "@/lib/types";
import { normalizeSpace, normalizeTool } from "@/lib/validate";
import { AGENT_INPUT_ID, AgentBar } from "./AgentBar";
import { SettingsDialog, ShareDialog, TemplatesDialog } from "./Dialogs";
import { GUIDE_START, GuideCard, type GuideState } from "./GuideCard";
import { Onboarding, type NewPlan } from "./Onboarding";
import { usePublik } from "./PublikGate";
import { ToolCard } from "./ToolCard";
import { Avatar, Logo, btnAccent, btnGhost, btnOutline, miniInput } from "./ui";

type Toast = { text: string; action?: { label: string; run: () => void } };

/** Asks shown under the bar in the sample plan. */
const SAMPLE_SUGGESTIONS = [
  "a poll for friday's hike: easy, medium or summit",
  "split $340 for the cabin hot tub between everyone",
  "seating chart for 3 tables of 6",
  "bracket for 8 teams",
  "chore rota for the week",
];

function hashColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}

/** The plan saved on this device, if it is really theirs. */
function readOwn(): Space | null {
  const raw = read(KEYS.space);
  if (!raw) return null;
  try {
    const s = normalizeSpace(JSON.parse(raw));
    if (s.id !== SAMPLE_ID) return s;
    // Before 0.3 everyone landed in the sample and it was saved as their space. Keep it only if they made it
    // theirs (renamed it); otherwise this person has no plan yet and gets the start screen.
    return s.title !== demoSpace().title ? { ...s, id: uid() } : null;
  } catch {
    return null;
  }
}

/**
 * The software behind Sign in with publik. First run (no plan on this device) shows the start screen;
 * the sample plan is something you look at, never your saved plan.
 */
export default function App() {
  const publik = usePublik();
  const [screen, setScreen] = useState<"loading" | "start" | "space">("loading");
  const [space, setSpace] = useState<Space | null>(null);
  const [own, setOwn] = useState<{ title: string } | null>(null);
  const [me, setMe] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [banner, setBanner] = useState("");
  const [notice, setNotice] = useState("");
  const [guide, setGuide] = useState<GuideState>(GUIDE_START);

  const ai = aiStatus(publik.choice, apiKey, model);
  const isSample = space?.id === SAMPLE_ID;

  const openSpace = useCallback((s: Space) => {
    const storedMe = read(KEYS.me);
    const names = s.members.map((m) => m.name);
    setSpace(s);
    setMe(s.id === SAMPLE_ID ? "Maya" : storedMe && names.includes(storedMe) ? storedMe : (names[0] ?? "You"));
    setScreen("space");
  }, []);

  /* ---------- load ---------- */
  useEffect(() => {
    setApiKey(read(KEYS.apiKey) ?? "");
    setModel(read(KEYS.model) || DEFAULT_MODEL);
    try {
      const g = JSON.parse(read(KEYS.guide) ?? "null") as Partial<GuideState> | null;
      if (g && typeof g === "object") setGuide({ hidden: !!g.hidden, touched: !!g.touched, shared: !!g.shared });
    } catch {
      /* default guide */
    }
    const mine = readOwn();
    setOwn(mine ? { title: mine.title } : null);

    (async () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith(SHARE_PARAM)) {
        try {
          const s = await decodeSpace(hash.slice(SHARE_PARAM.length));
          openSpace(s);
          setBanner(`You opened a shared copy of “${s.title}”. Your edits stay on this device. Hit Share to send your version back.`);
        } catch {
          if (mine) {
            openSpace(mine);
            setBanner("That share link looks broken or cut off, so you're seeing your own plan instead.");
          } else {
            setNotice("That share link looks broken or cut off. Ask for a fresh one, or start your own plan.");
            setScreen("start");
          }
        }
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } else if (mine) {
        openSpace(mine);
      } else {
        setScreen("start");
      }
    })();
  }, [openSpace]);

  /* ---------- save (the sample is never saved) ---------- */
  useEffect(() => {
    if (!space || space.id === SAMPLE_ID) return;
    write(KEYS.space, JSON.stringify(space));
    setOwn((o) => (o?.title === space.title ? o : { title: space.title }));
  }, [space]);
  useEffect(() => {
    if (me && space && space.id !== SAMPLE_ID) write(KEYS.me, me);
  }, [me, space]);

  const updateGuide = useCallback((p: Partial<GuideState>) => {
    setGuide((g) => {
      const next = { ...g, ...p };
      write(KEYS.guide, JSON.stringify(next));
      return next;
    });
  }, []);

  function createPlan(p: NewPlan) {
    const members = [p.you, ...p.others].map((name, i) => ({ id: uid(), name, color: colorFor(i) }));
    const s: Space = { v: 1, id: uid(), title: p.title, subtitle: p.subtitle, members, pins: [], tools: [] };
    setSpace(s);
    setMe(p.you);
    setNotice("");
    setBanner("");
    updateGuide({ touched: false, shared: false });
    setScreen("space");
    window.scrollTo({ top: 0 });
  }

  function openSample() {
    setBanner("");
    openSpace(demoSpace());
    window.scrollTo({ top: 0 });
  }

  function openOwn() {
    const mine = readOwn();
    setBanner("");
    if (mine) openSpace(mine);
    else setScreen("start");
  }

  function startNew() {
    if (own && !confirm(`Start a new plan? It replaces “${own.title}” on this device. Export it first from the ⋯ menu to keep a copy.`)) return;
    setScreen("start");
    window.scrollTo({ top: 0 });
  }

  if (screen === "loading") return <div className="min-h-screen bg-bg" aria-busy />;
  if (screen === "start" || !space)
    return (
      <Onboarding
        ai={ai}
        notice={notice}
        onCreate={createPlan}
        onSample={openSample}
        back={own ? { label: `Back to “${own.title}”`, run: openOwn } : undefined}
      />
    );

  return (
    <Workspace
      space={space}
      update={(fn) => setSpace((s) => (s ? fn(s) : s))}
      replace={(s) => openSpace(s)}
      me={me}
      setMe={setMe}
      ai={ai}
      viaPublik={publik.choice === "publik"}
      apiKey={apiKey}
      model={model}
      onSaveSettings={(k, m) => {
        setApiKey(k);
        setModel(m || DEFAULT_MODEL);
        write(KEYS.apiKey, k || null);
        write(KEYS.model, m && m !== DEFAULT_MODEL ? m : null);
      }}
      isSample={isSample}
      ownTitle={own?.title ?? null}
      onStartNew={startNew}
      onOpenSample={openSample}
      onBackToOwn={openOwn}
      banner={banner}
      setBanner={setBanner}
      guide={guide}
      updateGuide={updateGuide}
    />
  );
}

function Workspace({
  space,
  update,
  replace,
  me,
  setMe,
  ai,
  viaPublik,
  apiKey,
  model,
  onSaveSettings,
  isSample,
  ownTitle,
  onStartNew,
  onOpenSample,
  onBackToOwn,
  banner,
  setBanner,
  guide,
  updateGuide,
}: {
  space: Space;
  update: (fn: (s: Space) => Space) => void;
  replace: (s: Space) => void;
  me: string;
  setMe: (name: string) => void;
  ai: AiStatus;
  viaPublik: boolean;
  apiKey: string;
  model: string;
  onSaveSettings: (key: string, model: string) => void;
  isSample: boolean;
  ownTitle: string | null;
  onStartNew: () => void;
  onOpenSample: () => void;
  onBackToOwn: () => void;
  banner: string;
  setBanner: (s: string) => void;
  guide: GuideState;
  updateGuide: (p: Partial<GuideState>) => void;
}) {
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
  const [pinDraft, setPinDraft] = useState("");
  const [memberDraft, setMemberDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  // Switching between your plan and the sample: nothing half-done carries over.
  useEffect(() => {
    setTarget(null);
    setErrorState({ text: "" });
    setPrompt("");
  }, [space.id]);

  const people = useMemo(() => space.members.map((m) => m.name), [space.members]);
  const colorOf = useCallback(
    (name: string) => space.members.find((m) => m.name === name)?.color ?? hashColor(name),
    [space.members],
  );
  const examples = useMemo(() => examplePrompts(people), [people]);
  const showGuide = !isSample && !guide.hidden;

  /* ---------- mutations ---------- */
  const patch = (p: Partial<Space>) => update((s) => ({ ...s, ...p }));
  const updateTool = (t: Tool) => {
    update((s) => ({ ...s, tools: s.tools.map((x) => (x.id === t.id ? t : x)) }));
    if (!isSample && !guide.touched) updateGuide({ touched: true });
  };
  const removeTool = (id: string) => {
    const idx = space.tools.findIndex((t) => t.id === id);
    const removed = space.tools[idx];
    if (!removed) return;
    update((s) => ({ ...s, tools: s.tools.filter((t) => t.id !== id) }));
    if (target === id) setTarget(null);
    showToast({
      text: `Removed “${removed.title}”.`,
      action: {
        label: "Undo",
        run: () =>
          update((s) => {
            const tools = [...s.tools];
            tools.splice(Math.min(idx, tools.length), 0, removed);
            return { ...s, tools };
          }),
      },
    });
  };

  function addTool(tool: Tool) {
    update((s) => ({ ...s, tools: [tool, ...s.tools] }));
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

  /** An example ask goes into the bar, ready to send (or edit first). */
  function fillPrompt(text: string) {
    setPrompt(text);
    setTarget(null);
    setError("");
    requestAnimationFrame(() => {
      const el = document.getElementById(AGENT_INPUT_ID) as HTMLInputElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
      el.setSelectionRange(text.length, text.length);
    });
  }

  function openShare() {
    setModal("share");
    if (!isSample && !guide.shared) updateGuide({ shared: true });
  }

  async function ask() {
    const text = prompt.trim().replace(/^@potluck\b[:,]?\s*/i, "");
    if (!text) return;
    setError("");
    const current = target ? space.tools.find((t) => t.id === target) : undefined;

    if (!ai.on) {
      if (current) {
        setError("Changing a tool with a sentence needs AI. Turn it on in settings (your publik plan or your own key), or edit the tool directly.");
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
        text: `Added the “${tpl.name}” starter. Turn on AI in settings for tools built from your exact words.`,
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
        update((s) => ({ ...s, tools: s.tools.map((x) => (x.id === next.id ? next : x)) }));
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
      replace(s.id === SAMPLE_ID ? { ...s, id: uid() } : s);
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
          {isSample && (
            <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-ink">sample</span>
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
            <button onClick={openShare} className={btnAccent}>
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
                  <div className="pop absolute right-0 z-50 mt-1 w-60 rounded-xl border border-line bg-card p-1 shadow-card">
                    <MenuItem icon={<FilePlus2 size={15} />} label="New plan" onClick={() => { setMenu(false); onStartNew(); }} />
                    {isSample ? (
                      ownTitle && <MenuItem icon={<ArrowRight size={15} />} label={`Back to “${ownTitle}”`} onClick={() => { setMenu(false); onBackToOwn(); }} />
                    ) : (
                      <>
                        <MenuItem icon={<Eye size={15} />} label="Look at the sample plan" onClick={() => { setMenu(false); onOpenSample(); }} />
                        {guide.hidden && (
                          <MenuItem icon={<CircleHelp size={15} />} label="How potluck works" onClick={() => { setMenu(false); updateGuide({ hidden: false }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                        )}
                      </>
                    )}
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

      {isSample && (
        <div className="border-b border-accent/30 bg-accent-soft px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-ink">Sample</span>
            <span className="min-w-0 flex-1 text-ink-2">
              An example plan to poke at: vote, drag, split, ask @potluck. Nothing you do here is saved.
            </span>
            {ownTitle ? (
              <button onClick={onBackToOwn} className={`${btnAccent} py-1.5`}>
                Back to “{ownTitle}” <ArrowRight size={15} />
              </button>
            ) : (
              <button onClick={onStartNew} className={`${btnAccent} py-1.5`}>
                Start my own plan <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      )}

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
                placeholder="Name your plan"
                className="w-full rounded-lg bg-transparent font-display text-3xl font-bold tracking-tight outline-none placeholder:text-muted/60 focus:bg-card/70 sm:text-[40px] sm:leading-[1.1]"
                aria-label="Plan name"
              />
              <input
                value={space.subtitle}
                onChange={(e) => patch({ subtitle: e.target.value.slice(0, 140) })}
                placeholder="Dates, place, who's coming…"
                className="w-full rounded-lg bg-transparent text-[15px] text-muted outline-none placeholder:text-muted/70 focus:bg-card/70"
                aria-label="Plan details"
              />
            </div>

            <AgentBar
              value={prompt}
              onChange={setPrompt}
              onSubmit={ask}
              busy={busy}
              ai={ai}
              suggestions={showGuide ? [] : isSample ? SAMPLE_SUGGESTIONS : examples}
              error={error.text}
              topUpUrl={error.topUpUrl}
              targetTitle={targetTool?.title ?? null}
              onClearTarget={() => setTarget(null)}
              onOpenSettings={() => setModal("settings")}
              onOpenTemplates={() => setModal("templates")}
            />

            {showGuide && (
              <GuideCard
                title={space.title}
                examples={examples}
                ai={ai}
                hasTools={space.tools.length > 0}
                onlyYou={space.members.length < 2}
                state={guide}
                onExample={fillPrompt}
                onStarters={() => setModal("templates")}
                onShare={openShare}
                onSettings={() => setModal("settings")}
                onHide={() => {
                  updateGuide({ hidden: true });
                  showToast({ text: "Guide hidden. Bring it back from the ⋯ menu: How potluck works." });
                }}
              />
            )}

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
                    Tools you ask @potluck for land here, live for the whole group. Or drop in a starter and edit it in place:
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
              {space.members.length < 2 && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-bg-2/70 px-2 py-1.5 text-xs leading-snug text-ink-2">
                  <Users size={13} className="mt-px shrink-0 text-muted" />
                  Just you so far. Add who&apos;s coming and every tool fills in their names.
                </p>
              )}
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
                {space.pins.length === 0 && (
                  <li className="text-sm leading-snug text-muted">
                    Nothing pinned yet. Paste the Airbnb link, an address, a budget note: @potluck reads these when it builds.
                  </li>
                )}
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
        potluck · free & open source (MIT) · not affiliated with Google Tabletop · your plan lives in this browser
      </footer>

      {toast && (
        <div className="pop fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-4 py-2.5 text-sm text-bg shadow-xl">
          <span>{toast.text}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.run();
                setToast(null);
              }}
              className="shrink-0 font-semibold text-accent-soft underline underline-offset-2"
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
            onSaveSettings(k, m);
            setModal(null);
            setError("");
            showToast({
              text: k
                ? viaPublik
                  ? "Key saved in this browser. AI uses your publik plan until you switch to My own key."
                  : "Key saved in this browser. AI is on: ask for anything."
                : viaPublik
                  ? "Key removed. AI still uses your publik plan."
                  : "Key removed. AI is off: asks match starters until you add a key or switch to your publik plan.",
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
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
