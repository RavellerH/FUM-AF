# FUM-AF — Claude Context

## Project
Personal finance tracker for a single user. Parses Mandiri bank statement PDFs,
categorises transactions, and shows dashboards + analysis. Built with React + Vite +
TypeScript, backed by Supabase (project ID: `loaqwetrozsvrwmhhfwk`, region: ap-southeast-2).

## Stack
- Frontend: React 18, TypeScript, Tailwind CSS, Recharts
- Backend: Supabase (Postgres + Auth + RLS)
- AI: Gemini (spending insights)
- Deploy: Vercel

## Key conventions
- Currency: IDR, formatted as `fmt()` (no decimals, id-ID locale)
- Categories excluded from expense KPI: `Third-Party Transfer`, `Housing`, `Investment`, `Reimbursable`
- Income categories counted in KPI: `Family`, `Salary`
- `Reimbursable` expense = user paid for someone else, expects repayment
- `Reimbursement` income = money paid back to user
- Bank statement files are always Mandiri format

## Memory system
At the **start of every session**, load context by querying Supabase:

```sql
-- Recent session logs (last 5)
SELECT session_date, content FROM claude_memory
WHERE category = 'session_log'
ORDER BY created_at DESC LIMIT 5;

-- All standing facts / preferences
SELECT key, content FROM claude_memory
WHERE category IN ('fact', 'preference', 'outstanding')
ORDER BY created_at DESC;
```

At the **end of a session** where meaningful work happened, write a log entry:

```sql
INSERT INTO claude_memory (category, key, content)
VALUES ('session_log', null, '<brief summary of what was done and any open items>');
```

For persistent facts (e.g. account balance anchor date, goals), use:

```sql
INSERT INTO claude_memory (category, key, content)
VALUES ('fact', 'starting_balance', '<value and date>');
-- To update: DELETE old row first, then INSERT
```

### Memory categories
| category | purpose |
|---|---|
| `session_log` | What happened each session, open items |
| `fact` | Persistent financial facts (balances, goals) |
| `preference` | User preferences for how Claude should behave |
| `outstanding` | Items needing follow-up (unpaid reimbursables, etc.) |

## Development branch
Active work goes on branches prefixed `claude/`.
