const DATA_OWNER = (import.meta.env.VITE_DATA_OWNER as string | undefined) ?? 'ravellerh';
const DATA_REPO = (import.meta.env.VITE_DATA_REPO as string | undefined) ?? 'fum-af-data';
const API = 'https://api.github.com';

function ghHeaders(pat: string) {
  return {
    Authorization: `token ${pat}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

// Encode string → base64, handling full Unicode (Indonesian descriptions, etc.)
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Decode base64 → string, handling full Unicode
function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
  return new TextDecoder().decode(bytes);
}

// File format: JSON data wrapped in ---json / --- fences inside a markdown file
function serialize(data: unknown): string {
  return `---json\n${JSON.stringify(data, null, 2)}\n---\n`;
}

function deserialize<T>(content: string): T {
  const m = content.match(/^---json\n([\s\S]*?)\n---/);
  if (!m) throw new Error('Invalid data file — missing ---json block');
  return JSON.parse(m[1]) as T;
}

// GET a file from the data repo. Returns null if not found.
export async function ghGet<T>(pat: string, path: string): Promise<T | null> {
  const r = await fetch(`${API}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`, {
    headers: ghHeaders(pat),
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read error ${r.status} on ${path}`);
  const json = await r.json();
  return deserialize<T>(fromBase64(json.content));
}

// PUT a file into the data repo. Fetches current SHA automatically so callers never need it.
export async function ghPut(pat: string, path: string, data: unknown): Promise<void> {
  const url = `${API}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`;
  // Fetch current SHA (required by GitHub API when updating an existing file)
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

// List file names in a directory. Returns [] if directory doesn't exist.
export async function ghList(pat: string, path: string): Promise<string[]> {
  const r = await fetch(`${API}/repos/${DATA_OWNER}/${DATA_REPO}/contents/${path}`, {
    headers: ghHeaders(pat),
  });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`GitHub list error ${r.status} on ${path}`);
  const items = await r.json() as Array<{ name: string }>;
  return items.map(i => i.name);
}

// Verify that a PAT is valid by hitting /user
export async function ghVerifyPat(pat: string): Promise<boolean> {
  const r = await fetch(`${API}/user`, {
    headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' },
  });
  return r.ok;
}
