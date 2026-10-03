# FUM-AF — Memory

The only cross-session memory. Edit in place; keep each line self-contained. Merchant →
category rules live in `data/rules.md`, accounting rules in `CLAUDE.md`, totals come from
`python3 scripts/audit.py` — don't copy them here.

## People
| In statement | Who | Categorize as |
|---|---|---|
| NINA SITI AMINAH | Bu Nina, family support | 6,000,000/month → `Family`. Other amounts repay Lab work → `Reimbursement` |
| AULIA HANIFA BUDIMAN | family | Repays Claude subscription and fronted costs (e.g. servis motor) → `Reimbursement`. Sent `Family` support in Jan–May 2026 |
| MAMAN BUDIMAN | ayah (father) | Help / pass-through → `Third-Party Transfer` unless the user says otherwise |
| PATIMAH AHMAD | istri (wife) | Transfers to her (BSI or Flip) = kebutuhan rumah → `Household` |
| FAZA HAFIYAN MASJHUR | side-income source | Money from Faza → `Side Income`, also when it arrives via the user's BCA |
| PUSPITA YANTI HJ. | pass-through sender | `Third-Party Transfer` (Jul 2026: 2,000,000 passed on to Faza) |
| MUHAMAD FARHAN BUDIMAN | the user's own BCA | Depends on whose money it is — ask |
| Kavi | anak (child) | Khitan Jun 2026; dirawat di RSIA Limijati Aug 2026 |

## Merchant notes and exceptions
- `FLIPTECH LENTERA INS` (Flip) is a generic transfer service: the note decides the category
  (BTC INVEST → Investment, patimah → Household, beli ikan MPASI → Household, kelas →
  Education, Lab / "by pass dari Bu nina" → Reimbursable, Air Almandzar → Home Maintenance).
- Danatopup ~388–400K on the 2nd–3rd = Claude subscription, always repaid by Aulia →
  `Reimbursable`. Other Danatopup amounts follow the rule (Utilities).
- Xendit 88908 = IndiHome internet. SSB / Soto SSB = Soto Sedap Boyolali. TAUFIQ SUMPENO = obat herbal.
- GNHK CELL: Sep 2026 100K was bensin (Transport); other months vary — ask.
- BPJS Kesehatan unpaid since Jul 2026 **by choice** (money goes to direct doctor visits,
  e.g. Limijati). Don't flag it as a missed bill.
- Fuel is higher since the user drives his father's Innova.
- Aug 2026 Limijati: 4,000,000 DP paid in cash from Deviota savings (not in the statement);
  686,330 returned 26 Aug → `Refund`. Maman: 4,000,000 on 7 Aug withdrawn the same day
  (pass-through); 5,000,000 on 29 Aug = help for Kavi's care (`Third-Party Transfer`).

## In progress (resume here if a session was cut off)
User request 2026-10-03: salary not yet paid, must survive on Mandiri balance → detailed,
correct financial report + list of questions for the user. TODO:
1. [ ] README: remove stale Supabase references (app is GitHub-backed).
2. [ ] Compute: monthly cash flow (all in − all out), Sep closing balance 1,808,694,
   essential vs discretionary (Jul–Sep avg), fixed bills, fees, portfolio buffer, runway.
3. [ ] Publish HTML report artifact (Bahasa Indonesia) incl. questions for the user.
4. [ ] Move the questions into "Open questions", add decision-log line, push, ask to merge.
Branch `claude/adoring-euler-Xt0Pb` is NOT merged yet (memory rewrite, scripts, Aug/Sep fixes).

## Month status
| Month | Status |
|---|---|
| 2026-01 … 2026-07 | locked |
| 2026-08 | locked (2026-10-03) |
| 2026-09 | reviewed 2026-10-03; lock once the open questions below are answered |

## Open questions (ask, then move the answer above and delete the line)
- Sep 2026 Uncategorized: WijayaPay ×5 (345K), Flip without note ×3 (161K), GoPay Customer
  081322808849 ×2 (120K), Midtrans 95K (by pass dari Salma?), Finpay 76K, IDM QRIS LIVIN 33K,
  M.Amud Royal Jaya 10K.
- Aug 2026: ShopeePay ×6 are `Third-Party Transfer` (hidden from KPI) — titipan or own spending?
- Indomaret: `Food & Dining` (Jan–Jul) vs `Household` (Aug–Sep) — pick one, then add a rule.
- Jan 2026 Faza 285,000 is `Freelance` (not in Income KPI) — make it `Side Income`?
- Tech debt: `src/` hardcodes "Hyperliquid" labels (Investment, Analysis) — derive from portfolio data.

## Decision log (newest first, one line each)
- 2026-10-03: Memory simplified to this file + `data/rules.md` + `scripts/` (audit, import);
  Supabase memory retired (project unreachable). Fixed rules (FLIPTECH→Healthcare removed,
  YOMART→Housing → Household; fees first). Aug/Sep Claude guesses aligned to user rules:
  Shopee/ShopeePay → Household, PLN/Xendit → Utilities, Patimah → Household.
- 2026-10-03: Sep imported and reviewed with the user. Added `Side Income`; Net no longer
  double-counts Reimbursement; Claude subscription → Reimbursable for Mar–Sep.
- 2026-08-13: Aug imported. User: Maman 4M + ATM 4M = bypass; FLIPTECH 42,331 water bill =
  Housing; Air Almandzar is not water → Home Maintenance; OVO → Food & Dining; GoPay 20K GO-SEND → Transport.
- 2026-08-02: Jul imported. Fixed live "Failed to fetch" (no custom headers on
  raw.githubusercontent fetches — preflight gets 403). Nina's 29 Jul 6M counted in August.
