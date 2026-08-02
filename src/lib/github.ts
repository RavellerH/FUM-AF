const OWNER = 'ravellerh';
const REPO = 'FUM-AF';
const BRANCH = 'main';
const DIR = 'data';
const API = 'https://api.github.com';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${DIR}`;

function ghHeaders(pat: string) {
  return {
    Authorization: `token ${pat}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function serialize(data: unknown): string {
  return `---json\n${JSON.stringify(data, null, 2)}\n---\n`;
}

function deserialize<T>(content: string): T {
  const m = content.match(/^---json\n([\s\S]*?)\n---/);
  if (!m) throw new Error('Invalid data file — missing ---json block');
  return JSON.parse(m[1]) as T;
}

// Read a file from the public repo — no PAT needed.
// Note: no custom request headers here — any non-safelisted header would trigger
// a CORS preflight, and raw.githubusercontent.com answers OPTIONS with 403.
// The `?_=${Date.now()}` cache-buster keeps reads fresh without needing headers.
export async function ghGet<T>(path: string): Promise<T | null> {
  const r = await fetch(`${RAW}/${path}?_=${Date.now()}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read error ${r.status} on ${path}`);
  return deserialize<T>(await r.text());
}

// Write a file — PAT required.
export async function ghPut(pat: string, path: string, data: unknown): Promise<void> {
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${DIR}/${path}`;
  const existingRes = await fetch(url, { headers: ghHeaders(pat) });
  const sha = existingRes.ok ? (await existingRes.json()).sha as string : undefined;

  const r = await fetch(url, {
    method: 'PUT',
    headers: ghHeaders(pat),
    body: JSON.stringify({
      message: `update ${path}`,
      content: toBase64(serialize(data)),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}));
    throw new Error(`GitHub write error ${r.status} on ${path}: ${JSON.stringify(detail)}`);
  }
}

// List a directory in the public repo — no PAT needed (60 req/hr unauthenticated, enough for personal use).
export async function ghList(path: string): Promise<string[]> {
  const r = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${DIR}/${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`GitHub list error ${r.status} on ${path}`);
  const items = await r.json() as Array<{ name: string }>;
  return items.map(i => i.name);
}

// Validate a PAT — used in Settings when the user saves a new token.
export async function ghVerifyPat(pat: string): Promise<boolean> {
  const r = await fetch(`${API}/user`, {
    headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' },
  });
  return r.ok;
}
