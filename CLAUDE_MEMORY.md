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
| SALMA RUFAIDA BUDIMAN (SMBC) | family | Oct 2026: 2,500,000 help for the mother-in-law's funeral → `Reimbursement` |
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

## Current situation (2026-10-03)
- Salary from the user's job is not paid yet; the user must live on the Mandiri balance
  (last known 1,808,694 on 2026-09-30). Spending runs ~1.9M/month above income at the Sept
  pattern. Proposed survival budget 5,550,000/month (pause BTC DCA, cut eating out and cash).
- Report: https://claude.ai/artifact/UF5czDyVaCk2cm28njveEo (update it when October data or
  the answers below arrive).
- 2026-10-19: Bu Nina's October 6,000,000 arrived. IHSG crash (MSCI consultation to move Indonesia
  to Standalone; decision end of Jun 2027): the user decided to EXIT all stocks. Stock equity was
  4,100,000 on 2026-10-19 and ~3.x million on 2026-10-20 (vs 5,446,500 on 2026-09-01). By 2026-10-20 the big banks
  (BBCA, BBRI, BMRI) were sold. Snapshot 2026-10-28 (screenshots, in data/portfolio.md): only SINI
  3 lots left (avg 12,610.55 — 2 lots bought after 1 Sep; price 9,575; −910,666 unrealized),
  Stockbit RDN cash 915,936. BEI ARB is 7%/day until 31 Dec 2026, minimum price Rp1.
  SINI context: rallied on news that CUAN (Petrindo) is negotiating to take SINI over (~18,300 on
  23 Sep); pre-rally level ~7,350 (24 Aug snapshot); foreign net buy Rp26bn on 27 Oct. Event-driven:
  can fall back toward the pre-rumour level or jump on a takeover/tender offer.
  Fundamentals (press, 2026-10-29): 481M shares (mcap ≈4.6T at 9,575); FY2025 revenue 534B, loss ~42B,
  equity −763B; H1 2026 "profit" ~680B is a one-off negative-goodwill gain from buying PT Kemilau Mulia
  Sakti (Rp1.73T, Jun 2026), equity still −125B, related-party debt 1.52T. CUAN holds 27.78%, no binding
  deal as of 30 Sep (Dec 2025 attempt was halted); a completed takeover would trigger a tender offer.
- 2026-10-29: User DECIDED TO HOLD all 3 SINI lots as a deliberate bet on the CUAN takeover, accepting
  the risk (supersedes "exit all stocks" for SINI). Don't push them to sell again; treat SINI as ~0 in
  survival planning, and flag only real news (deal signed/cancelled, tender offer price).
- 2026-10-28: User plans to start a HYPE DCA from November, Rp600,000 (asked Rabby/Hyperliquid vs
  FLOQ; FLOQ lists HYPE/IDR with a claimed zero fee). Last recorded BTC: 0.0049615 on Indodax
  (1 Sep 2026 snapshot); 2026-10-28: BTC 0.00569446 = 8,563,169 (+15% unrealized) and the user
  holds 1.722 HYPE (1.05 on Hyperliquid + 0.672 in Rabby, per Nansen) ≈ $140.60 ≈ 2,530,800 at
  Rp18,000/USD → HYPE is ~22.8% of BTC+HYPE; gap to the 30% target ≈ 1.14M. There is NO USDC on
  Hyperliquid (the earlier "$86 USDC" was the 1.05 HYPE), so Hyperliquid is not a stable cash reserve;
  the survival report's "sell Hyperliquid stablecoin first" advice is outdated. Also: NEAR 1.08, SOL
  0.00495, ETH ~0.000224, PUMP 1,302.25 (Nansen covers Rabby + Phantom).
- Crypto allocation target (user-confirmed 2026-10-28): **70% BTC : 30% HYPE**, measured on BTC + HYPE
  only, counting HYPE in every wallet. HYPE target = BTC value × 30/70.
  DCA rules: Rp500–600K/month (start ~450K = monthly surplus until salary is paid), bought after
  Bu Nina's transfer, skipped in an emergency month. All DCA goes to HYPE until it reaches 30%;
  afterwards each month buy whichever asset is below its target weight (no selling to rebalance).
  HYPE (and new BTC) via FLOQ; existing BTC stays on Indodax.
- 2026-10-28: Stock loss estimate (Stockbit): equity ≈5,612,678 on 1 Sep (stocks 5,446,500 + ~166K cash)
  → 3,788,436 on 28 Oct (−1.82M, −32.5%); vs cost ≈5,888,248 → −2.10M (−35.7%), assuming no RDN
  withdrawals since 1 Sep. Exact lifetime loss needs Stockbit realized P&L / deposit history.
- 2026-10-28: User wants to try Variational Omni (omni.variational.io, zero-fee RFQ perps on Arbitrum)
  to learn and farm points (VAR TGE expected Q4 2026). Advised: small capped "tuition" amount, ≤2x, not
  from the survival budget. Proceeds (T+2 to RDN) become the first
  survival reserve. Waiting for the actual sale amounts to record the snapshot/realized loss.
- Oct 2026 one-off: trip to Bogor (14–16 Oct) for the funeral of the user's mother-in-law (wife
  Patimah's mother). User-confirmed: all trip/funeral rows → new category `Duka & Keluarga` (counted in
  Expenses, shown separately; 3,571,266 incl. 2M cash withdrawn); Salma 2.5M + Aulia 2M = help for the
  funeral → `Reimbursement` (aid offsets Expenses in Net).
- Mandiri balance 2,500,000 on 2026-10-19 (≈5.3M spent Oct 1–19 incl. the funeral trip).

## Month status
| Month | Status |
|---|---|
| 2026-01 … 2026-07 | locked |
| 2026-08 | locked (2026-10-03) |
| 2026-09 | reviewed 2026-10-03; lock once the open questions below are answered |
| 2026-10 | partial import (1–28 Oct, 163 rows) on 2026-10-29; awaiting answers + full statement. When the full statement arrives, import it to a temp copy and carry categories over by matching date+amount+description — don't `--force` over reviewed rows |

## Open questions (ask, then move the answer above and delete the line)
- URGENT (survival plan):
  salary amount and expected date; will Bu Nina keep sending 6M/month; other money (BCA, cash,
  ShopeePay/GoPay); big bills due Oct–Dec (rent — Apr 25M was recorded as titipan, who pays and
  when next?, Innova tax/service, classes); can father help with Innova fuel; what the ~850K/month
  cash withdrawals are for; OK to pause BTC DCA; which assets may be sold and minimum balance.
- Sep 2026 Uncategorized: WijayaPay ×5 (345K; in Jan/Feb/Jul WijayaPay was `Investment` — maybe Stockbit/crypto top-ups?), Flip without note ×3 (161K), GoPay Customer
  081322808849 ×2 (120K), Midtrans 95K (by pass dari Salma?), Finpay 76K, IDM QRIS LIVIN 33K,
  M.Amud Royal Jaya 10K.
- Aug 2026: ShopeePay ×6 are `Third-Party Transfer` (hidden from KPI) — titipan or own spending?
- Indomaret: `Food & Dining` (Jan–Jul) vs `Household` (Aug–Sep) — pick one, then add a rule.
- Jan 2026 Faza 285,000 is `Freelance` (not in Income KPI) — make it `Side Income`?
- Tech debt: `src/` hardcodes "Hyperliquid" labels (Investment, Analysis) — derive from portfolio data.

## Decision log (newest first, one line each)
- 2026-10-29: Added category `Duka & Keluarga` (user-approved) for funeral/family-emergency costs.
- 2026-10-29: Oct 1–28 imported. Maman 3.8M + 1.1M (10 Oct) = same-day pass-through for Lab payments (Deni Hamdani, Hendri Haryono RAM) → Reimbursement/Reimbursable.
- 2026-10-29: User holds SINI (3 lots) as a takeover bet; stock exit otherwise complete.
- 2026-10-28: Nansen screenshot: Hyperliquid balance is 1.05 HYPE (not USDC) — recorded as `crypto_investing`, `crypto_trading` set to 0; added SOL, precise ETH.
- 2026-10-28: Investment page: allocation donut (`AllocationPie.tsx`, top 5 + Lainnya). Rabby NEAR/ETH/USDT recorded as `crypto_investing` with token amounts; Hyperliquid remainder $86.44.
- 2026-10-28: Portfolio snapshot updated from screenshots (Stockbit, Indodax, Rabby, Phantom); 1 Sep moved to history. USD/IDR 18,000 assumed (app FX API unreachable from the sandbox).
- 2026-10-19: User exiting all stocks after the MSCI-driven IHSG crash; Bu Nina Oct 6M received.
- 2026-10-05: Sep missing in the live app: repo default branch is `claude/keen-heisenberg-qtPhp`
  (old), and the Contents API (month list, app writes) used the default branch. `src/lib/github.ts`
  now pins `ref`/`branch` to `main`. Default branch should be switched back to `main` in GitHub settings.
- 2026-10-04: Memory rewrite, scripts, Aug/Sep fixes and README cleanup merged to main (PR #31).
- 2026-10-03: Survival report published (link above).
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
