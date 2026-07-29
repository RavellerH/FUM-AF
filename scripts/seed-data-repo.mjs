/**
 * One-time seed script: pushes your exported data files to the private fum-af-data repo.
 *
 * Usage:
 *   node scripts/seed-data-repo.mjs <your-github-pat>
 *
 * Requirements:
 *   - Create a private GitHub repo named "fum-af-data" under your account first.
 *   - PAT must have `repo` scope.
 *   - Place your data files next to this script in scripts/data-repo/ (they were
 *     provided as a download alongside these instructions).
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const PAT = process.argv[2];
const OWNER = 'ravellerh';
const REPO = 'fum-af-data';
const DATA_DIR = join(fileURLToPath(import.meta.url), '..', 'data-repo');

if (!PAT) {
  console.error('Usage: node scripts/seed-data-repo.mjs <github-pat>');
  process.exit(1);
}

const headers = {
  Authorization: `token ${PAT}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

async function putFile(path, content) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  // Check if file exists (need SHA for updates)
  const existing = await fetch(url, { headers });
  const sha = existing.ok ? (await existing.json()).sha : undefined;

  const b64 = Buffer.from(content, 'utf8').toString('base64');
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: `seed: ${path}`, content: b64, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to write ${path}: ${JSON.stringify(err)}`);
  }
  console.log(`✓ ${path}`);
}

function walk(dir, base = '') {
  const results = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (statSync(full).isDirectory()) {
      results.push(...walk(full, rel));
    } else {
      results.push({ full, rel });
    }
  }
  return results;
}

const files = walk(DATA_DIR);
console.log(`Seeding ${files.length} files to ${OWNER}/${REPO}...`);
for (const { full, rel } of files) {
  await putFile(rel, readFileSync(full, 'utf8'));
}
console.log('\nDone! Your data repo is ready.');
