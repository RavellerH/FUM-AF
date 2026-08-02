# FUM-AF — Claude Memory

Cross-session memory for Claude working on this repo. Read the **Facts**,
**Preferences**, and **Outstanding** sections at session start; append to
**Session log** when meaningful work is done. Keep rows self-contained. This is
the file-based companion to the RLS-locked `public.claude_memory` table (which
is only reachable via Supabase MCP — this file always works).

## Facts

- `NINA SITI AMINAH` is family financial support. Sends 6,000,000 transfers to
  the Mandiri account (e.g. 2026-07-01 and 2026-07-29). Categorised `Family`
  income (counted in income KPI).
- Convention: money received in the last days of a month can be earmarked for
  the next month. On 2026-08-02 the 2026-07-29 NINA 6,000,000 was moved to
  August income (`2026-08-01`, file `data/transactions/2026-08.md`).
- `PUSPITA YANTI HJ.` (BCA) is a pass-through/bypass sender: 2,000,000 inbound
  on 2026-07-01, immediately sent on to `FAZA HAFIYAN MASJHUR` (BRI).
  Both sides are `Third-Party Transfer` → net zero, excluded from expense KPI.
  There is no real 2,000,000 loan.
- `FLIPTECH LENTERA INS` is a generic payee used for many purposes; the
  description suffix (or per-date user override) decides the category. The
  2026-07-30 FLIPTECH 510,328 ("btc invest") is an Investment buy for August —
  moved to `2026-08-01` as August expense.
- July 2026 category totals (after above moves/reclass): Household 2,670,426 ·
  Food & Dining 1,428,152 · Utilities 1,602,790 · Healthcare 762,652 · Cash
  600,000 · Shopping 465,700 · Education 180,006 · Entertainment 158,960 ·
  Insurance 70,000 · Admin Fee 34,200 · Housing 56,000 · Refund 74,500 ·
  Reimbursement 788,000 (aid) · Family 6,000,000 (income KPI) · Investment
  710,328 · Third-Party Transfer 5,110,356 (incl. the 2,000,000 Puspita↔Faza
  bypass). Rows: 173. Income 9,972,856 · outgoing 10,739,214 · expense KPI
  7,972,886.

## Preferences

- Month-accurate accounting: money earned/bought for next month is recorded in
  that month's file with date set to the 1st, not the bank date.
- `Third-Party Transfer` = pass-through (bypass), never personal expense.
- Keep transaction rows even when they net to zero (preserve bank-statement
  truth); reclassify rather than delete.

## Session log

- `2026-08-02`: Imported full July 2026 Mandiri e-statement — 175 transactions,
  exact statement sums (income 15,972,856 / outgoing 11,249,542), added
  `Education` category, applied user per-date FLIPTECH/RIZKI EREN overrides.
  Fixed MyTelkomsel rule. Committed `d8e4c6f`.
- `2026-08-02`: Root-caused live-site "Failed to fetch" — `ghGet` set
  `Cache-Control: no-cache`, which Chrome preflights (OPTIONS), and
  `raw.githubusercontent.com` returns 403 to every OPTIONS. Removed the header
  (cache-buster `?_=${Date.now()}` already prevents staleness). Committed
  `15fa47e`; deploy `#25`; verified live dashboard loads all data.
- `2026-08-02`: Reclassified FAZA HAFIYAN 2,000,000 `Loan` → `Third-Party
  Transfer` (Puspita Yanti bypass, net zero). Moved 2026-07-29 NINA 6,000,000
  → August income and 2026-07-30 FLIPTECH 510,328 → August expense by creating
  `data/transactions/2026-08.md` (both dated 2026-08-01). July now 173 rows.
  Created this memory file.

## Outstanding

- None open. (Pending: August 2026 statement not yet imported — expected file
  `data/transactions/2026-08.md` already exists with the 2 carried-forward
  transactions.)
