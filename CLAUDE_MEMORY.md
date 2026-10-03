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
- Sept 2026 people/merchant context (user-confirmed): `PATIMAH AHMAD` is the
  user's wife; transfers to her (direct BSI or via FLIPTECH) are `Household`.
  Lab work paid up-front (ELVINA SUNJAYA BCA, FLIPTECH "by pass dari Bu nina",
  "pekerjaan Lab Fisika ITB") is `Reimbursable`, repaid by NINA as
  `Reimbursement` income (not `Family`). AULIA HANIFA BUDIMAN also repays as
  `Reimbursement` (Danatopup for Claude subscription, servis motor DENISH MOTOR).
  Real Family income = NINA 6,000,000. Anything from `FAZA HAFIYAN MASJHUR` is
  `Side Income` (counted in income KPI): in Sept 100,000 direct + 209,000 BCA
  self-transfer (Faza's 200K landed in the user's BCA, then moved to Mandiri).
- Merchant mappings: `SSB Cab Setiabudi` / `Soto SSB` = Soto Sedap Boyolali (Food &
  Dining); `GNHK CELL` = bensin (Transport); Xendit 88908 = IndiHome internet
  (Utilities); `TAUFIQ SUMPENO` = herbal medicine (Healthcare).
- Category vocabulary is fixed across months: use `Household` (incl. groceries,
  supermarkets, wife transfers), `Transport`, `Cash`, `Admin Fee`, `Education`,
  `Side Income`. Do NOT invent `Groceries`/`Transportation`/`Cash Withdrawal`/
  `Bank Fees` (fixed in Sept 2026 after they were used by mistake).
- Sept 2026 totals (after review): income KPI 6,309,000 (Nina 6,000,000 + Side
  Income 309,000) · expense KPI 7,719,268 · aid (Reimbursement) 1,862,500 ·
  net +452,232. Rows: 169.

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
- `2026-10-03`: Imported September 2026 Mandiri e-statement (169 rows, exact
  statement sums income 8,171,500 / outgoing 10,043,331; XLSX amounts use
  Indonesian format, truncate at the decimal comma). Recategorised per user
  review (see Facts), added `Side Income` to `INCOME_CATEGORIES`. PRs #28, #29.

## Outstanding

- September 2026: 15 uncategorised rows (~Rp919K) still awaiting user context:
  WijayaPay x5, Flip no-note x3, GoPay Customer 081322808849 x2, Midtrans 95K
  (possible bypass from Salma?), Danatopup 79K, Finpay 76K, IDM QRIS 33K,
  M.Amud Royal Jaya 10K.
- (Older) Pending: August 2026 statement not yet imported — expected file
  `data/transactions/2026-08.md` already exists with the 2 carried-forward
  transactions.)
