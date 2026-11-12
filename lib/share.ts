import type { Space } from "./types";
import { normalizeSpace } from "./validate";

/*
 * Share links carry the whole space in the URL hash, compressed with the
 * browser's built-in deflate. The hash never reaches a server.
 */

function toB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeSpace(space: Space): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(space));
  if (typeof CompressionStream === "undefined") return "j" + toB64url(json);
  return "z" + toB64url(await pipe(json, new CompressionStream("deflate-raw")));
}

export async function decodeSpace(token: string): Promise<Space> {
  const kind = token[0];
  const bytes = fromB64url(token.slice(1));
  let json: Uint8Array;
  if (kind === "z") json = await pipe(bytes, new DecompressionStream("deflate-raw"));
  else if (kind === "j") json = bytes;
  else throw new Error("Unknown link format");
  return normalizeSpace(JSON.parse(new TextDecoder().decode(json)));
}

export const SHARE_PARAM = "space=";
