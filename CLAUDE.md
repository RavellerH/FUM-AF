# FUM-AF — Claude instructions

Single-user personal finance tracker (Mandiri account). React 19 + TypeScript + Vite +
Tailwind + Recharts, deployed to GitHub Pages on every push to `main` (HashRouter, base `/FUM-AF/`).

**Data lives in this repo** as `---json` fenced files, read via raw.githubusercontent.com and
written by the app through the GitHub API with the user's PAT:
`data/transactions/YYYY-MM.md`, `data/categories.md`, `data/rules.md`, `data/portfolio.md`
(+ `data/portfolio_history/`). Gemini parses PDF uploads in the app. Supabase is legacy
(old migrations only) — the `claude_memory` table is retired; do not use it.

## Every session
1. Read `CLAUDE_MEMORY.md` first — it is the only memory. Don't re-ask what it answers.
2. Rows in months marked **locked** there are final: don't recategorize or edit them unless
   the user asks about that row/month.
3. New statement (.xlsx): `python3 scripts/import_mandiri_xlsx.py <file>` (password from the
   user, session-only — never store or commit it). Then ask only about `Uncategorized` rows,
   largest first.
4. Before committing data: `python3 scripts/audit.py` must report 0 errors. It also prints
   per-month KPIs — use it instead of recomputing totals by hand.
5. When the user confirms something reusable: merchant → category goes in `data/rules.md`;
   people, exceptions and one-off context go in `CLAUDE_MEMORY.md`. Update the month status
   and add one line to its decision log. Never duplicate a fact in two places.

## Category precedence
1. What the user said about that row → 2. `data/rules.md` (first match, same as the app)
→ 3. how the same merchant is categorized in locked months → 4. `Uncategorized`, ask.
Use only names in `data/categories.md`; never invent new ones without the user.

## Accounting rules (constants in `src/lib/constants.ts`)
- **Income KPI** = `Family`, `Salary`, `Side Income`.
- **Expense KPI** = every expense except `Third-Party Transfer`, `Housing`, `Investment`, `Reimbursable`.
- `Reimbursable` = user paid for someone and expects it back; `Reimbursement` = that money
  coming back (shown as aid). Repayments settle `Reimbursable` first; only the excess offsets
  Expenses in Net.
- `Third-Party Transfer` = pass-through/bypass money (in and out net to zero), never personal.
- `Refund` = money back for something that was not counted in Expenses (neutral).
- `Housing` = rent and the house water bill; shown under Fixed Costs, excluded from Expenses.
- The file a row sits in decides its month (money meant for next month goes in next month's file).
- Keep every bank row; reclassify, never delete.

## Code conventions
- IDR formatted with `fmt()` from `src/lib/format.ts`.
- Don't hardcode user-specific amounts, names or holdings in `src/` — derive from data;
  person-specific context belongs in `CLAUDE_MEMORY.md`.
- Work on `claude/*` branches; squash-merge to `main` via PR only when the user asks.
