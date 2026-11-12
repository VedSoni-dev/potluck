import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { MODELS, publikChat, resolveProvider } from "@/lib/publik";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { extractJson, normalizeTool } from "@/lib/validate";

/*
 * Two providers, picked by resolveProvider() from the person's choice at Sign in with publik:
 * - publik API (they chose "Connect your plan"): this browser's own publik install key, read from its
 *   sealed http-only cookie on the server, with a tier model. The key never reaches the browser.
 * - their own Anthropic key: it arrives in a request header, is used for this one call, and is never
 *   stored or logged. Nothing here writes to disk.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "claude-sonnet-5-5";
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5"]);

type Body = {
  prompt?: unknown;
  model?: unknown;
  space?: { title?: unknown; subtitle?: unknown; members?: unknown; pins?: unknown };
  current?: unknown;
};

const clip = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const ownKey = req.headers.get("x-anthropic-key")?.trim();
  const provider = resolveProvider(await cookies(), ownKey ? { baseURL: "https://api.anthropic.com", apiKey: ownKey } : null);
  if (provider.kind === "needs_own_key")
    return json({ error: "Add your Anthropic API key in settings, or switch to your publik plan, to build custom tools." }, 401);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const prompt = clip(body.prompt, 600).trim();
  if (!prompt) return json({ error: "Say what you want built." }, 400);

  const model =
    typeof body.model === "string" && /^[a-z0-9.-]{3,60}$/.test(body.model) ? body.model : DEFAULT_MODEL;

  const members = Array.isArray(body.space?.members)
    ? body.space!.members.slice(0, 40).map((m) => clip(m, 40)).filter(Boolean)
    : [];
  const pins = Array.isArray(body.space?.pins)
    ? body.space!.pins.slice(0, 20).map((p) => clip(p, 200)).filter(Boolean)
    : [];

  let context = `SPACE: ${clip(body.space?.title, 80) || "Untitled"}`;
  if (clip(body.space?.subtitle, 140)) context += `\nDETAILS: ${clip(body.space?.subtitle, 140)}`;
  context += `\nMEMBERS: ${members.join(", ") || "(none yet)"}`;
  if (pins.length) context += `\nNOTES ON THE BOARD:\n- ${pins.join("\n- ")}`;
  if (body.current) {
    try {
      const cur = normalizeTool(body.current);
      context += `\nCURRENT TOOL:\n${JSON.stringify({ ...cur, id: undefined, by: undefined, prompt: undefined })}`;
    } catch {
      /* ignore a broken current tool */
    }
  }

  const user = `${context}\n\nREQUEST: ${prompt}`;

  if (provider.kind === "publik") {
    const r = await publikChat(
      provider,
      { model: MODELS.balanced, max_tokens: 4000, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: user }] },
      req.signal,
    );
    // A 402 carries publik's message and exactly one link, its top_up_url.
    if (!r.ok) return json({ error: r.message, ...(r.topUpUrl ? { topUpUrl: r.topUpUrl } : {}) }, r.status);
    return toolFrom(r.text, prompt);
  }

  const client = new Anthropic({ apiKey: provider.apiKey, maxRetries: 1, timeout: 90_000 });

  try {
    const useFallbacks = FALLBACK_MODELS.has(model);
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low" },
      ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      messages: [{ role: "user", content: user }],
    });

    if (response.stop_reason === "refusal") {
      return json({ error: "The model declined that one. Try wording it differently." }, 422);
    }
    let text = "";
    for (const block of response.content) if (block.type === "text") text += block.text;
    return toolFrom(text, prompt);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return json({ error: "That API key was rejected." }, 401);
    if (error instanceof Anthropic.PermissionDeniedError)
      return json({ error: "This key can't use that model." }, 403);
    if (error instanceof Anthropic.NotFoundError) return json({ error: `Model "${model}" not found.` }, 404);
    if (error instanceof Anthropic.RateLimitError) return json({ error: "Rate limited. Wait a moment and retry." }, 429);
    if (error instanceof Anthropic.BadRequestError)
      return json({ error: `The API rejected the request: ${error.message.slice(0, 200)}` }, 400);
    if (error instanceof Anthropic.APIError)
      return json({ error: `Anthropic API error (${error.status ?? "network"}). Try again.` }, 502);
    return json({ error: "Couldn't reach the model. Try again." }, 502);
  }
}

function toolFrom(text: string, prompt: string) {
  let tool;
  try {
    tool = normalizeTool(extractJson(text));
  } catch (e) {
    return json({ error: `The agent's answer didn't fit a tool (${(e as Error).message}). Try again.` }, 422);
  }
  return json({ tool: { ...tool, prompt: prompt.slice(0, 200) } });
}
