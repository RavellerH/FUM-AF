# FUM-AF — Claude Context

## Project
Personal finance tracker for a single user. Parses Mandiri bank statement PDFs,
categorises transactions, and shows dashboards + analysis. Built with React + Vite +
TypeScript, backed by Supabase (project ID: `loaqwetrozsvrwmhhfwk`, region: ap-southeast-2).

## Stack
- Frontend: React 18, TypeScript, Tailwind CSS, Recharts
- Backend: Supabase (Postgres + Auth + RLS)
- AI: Gemini (statement parsing + spending insights)
- Deploy: GitHub Pages via `.github/workflows/deploy.yml` (HashRouter, base `/FUM-AF/`)

## Key conventions
- Currency: IDR, formatted with `fmt()` from `src/lib/format.ts` (no decimals, id-ID locale)
- Shared money constants live in `src/lib/constants.ts`:
  - `EXCLUDE_FROM_EXPENSE` (not counted in expense KPI): `Third-Party Transfer`, `Housing`, `Investment`, `Reimbursable`
  - `INCOME_CATEGORIES` (counted in income KPI): `Family`, `Salary`
- `Reimbursable` expense = user paid for someone else, expects repayment
- `Reimbursement` income = money paid back to user (kept out of Income KPI, shown as "aid")
- Bank statement files are always Mandiri format (password-protected PDF is the common case)
- Do not hardcode user-specific amounts, month counts, or holding names in
  `src/` — derive them from data. Person-specific context belongs in `claude_memory`.

## Memory system

`public.claude_memory` is Claude's cross-session memory. It is RLS-locked
(deny-all): the web app cannot touch it; only Claude via Supabase MCP can.

### Schema
| column | notes |
|---|---|
| `category` | `session_log` \| `fact` \| `preference` \| `outstanding` — nothing else |
| `key` | stable snake_case identifier; required for everything except `session_log` |
| `content` | the memory itself, self-contained prose |
| `status` | `active` (default) \| `resolved` \| `archived` — never delete rows |
| `session_date`, `created_at`, `updated_at` | bookkeeping (updated_at auto-touches) |

`(category, key)` is unique — always UPSERT keyed memories, never insert duplicates.

### At session start — load context
```sql
-- Recent session logs
SELECT session_date, content FROM claude_memory
WHERE category = 'session_log'
ORDER BY created_at DESC LIMIT 5;

-- Standing knowledge (only active rows)
SELECT category, key, content FROM claude_memory
WHERE category IN ('fact', 'preference', 'outstanding') AND status = 'active'
ORDER BY category, updated_at DESC;
```

### During / at end of session — write memory
Session log (once per session with meaningful work; append-only):
```sql
INSERT INTO claude_memory (category, content)
VALUES ('session_log', '<YYYY-MM-DD>: <what was done, decisions made, open items>');
```

Facts, preferences, outstanding items (upsert by key — no DELETE+INSERT):
```sql
INSERT INTO claude_memory (category, key, content)
VALUES ('fact', 'monthly_fixed_bills', '<content>')
ON CONFLICT (category, key) WHERE key IS NOT NULL
DO UPDATE SET content = EXCLUDED.content, status = 'active';
```

When an outstanding item is settled, resolve it — keep the history:
```sql
UPDATE claude_memory
SET status = 'resolved',
    content = content || ' | RESOLVED <YYYY-MM-DD>: <how>'
WHERE category = 'outstanding' AND key = '<key>';
```

### Category purposes
| category | purpose | key style |
|---|---|---|
| `session_log` | What happened each session, open items | none |
| `fact` | Persistent financial facts (bills, balances, coverage arrangements) | `monthly_fixed_bills`, `internet_bill` |
| `preference` | How the user wants Claude to behave/analyse | `expense_kpi_rules` |
| `outstanding` | Follow-ups (unpaid reimbursables, blocked work) | `reimbursable_<person>` |

Rules of thumb: keep each row self-contained (readable without other rows);
prefer updating an existing key over minting near-duplicates; use `archived`
for facts that stopped being true, `resolved` for completed follow-ups.

## Development branch
Active work goes on branches prefixed `claude/`.
