# FUM-AF — Personal Finance Tracker

A personal finance web app for importing, categorizing, and analyzing Indonesian bank statements (BCA, Mandiri, etc.). Built for one user, runs entirely in the browser, data stored in Supabase.

**Live app:** https://ravellerh.github.io/FUM-AF

---

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Monthly income vs. expense charts and per-category breakdowns |
| `/transactions` | Full transaction table with filters, inline editing, and date-grouped view |
| `/analysis` | Cash flow trends, spending breakdown, asset allocation, and AI-generated insights |
| `/investment` | Portfolio snapshot — stocks, crypto (Hyperliquid), and savings with live USD/IDR conversion |
| `/settings` | Category manager, auto-categorization rules engine, file password setting, re-parse tool |

---

## What it does

- **Upload bank statements** — drag-and-drop PDF or Excel files; password-protected PDFs supported
- **AI-powered parsing** — Gemini extracts transactions (date, amount, currency, description, type) from raw statement text
- **Categorize transactions** — click any category or type badge in the table to edit it inline; 21 categories available
- **Auto-categorization rules** — define keyword rules in Settings to auto-assign categories on upload
- **Filter & browse** — filter by month, transaction type (income/expense), or category
- **Date-grouped view** — transactions are grouped by date with a header row showing day and count
- **Dashboard & summaries** — monthly income vs. expense charts and per-category breakdowns
- **Analysis page** — cash flow trends, spending donut, category area chart, net worth snapshot, asset allocation, AI narrative insights via Gemini
- **Investment tracker** — manual portfolio snapshot for stocks (lots, PnL, sector mix), Hyperliquid crypto (equity breakdown in USD/IDR), and crypto investing positions
- **Secure** — email whitelist via Supabase Auth; only approved accounts can log in

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| AI parsing & insights | Google Gemini API (`@google/generative-ai`) |
| PDF parsing | pdf.js (`pdfjs-dist`) |
| Excel parsing | SheetJS (`xlsx`) |
| File upload UX | react-dropzone |
| Charts | Recharts |
| Hosting | GitHub Pages |

---

## Local development

```bash
npm install
cp .env.local.example .env.local
# fill in your keys
npm run dev
```

**Required environment variables:**
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`, `VITE_ALLOWED_EMAIL`.

---

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via GitHub Actions. The workflow builds the Vite app and publishes `./dist` using `peaceiris/actions-gh-pages`. Secrets required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`, `VITE_ALLOWED_EMAIL`.

---

## Project structure

```text
src/
  components/
    Analysis/       # cash flow charts, spending breakdown, AI insights, net worth
    Auth/           # AuthGuard, PasswordGate
    Dashboard/      # charts and summary cards
    Investment/     # portfolio snapshot (stocks, crypto, savings)
    Settings/       # CategoryManager, RulesManager, FilePasswordSetting, ReParseButton
    Transactions/   # table, filters, inline editing
    Upload/         # drag-and-drop, PDF/Excel parsing, Gemini call
    shared/         # Navbar, Spinner, ErrorBanner, etc.
  hooks/            # useAuth, useTransactions, useCategories, useSummaries, usePortfolio, useRules, useFilePassword
  lib/              # supabase client, gemini client
  pages/            # App.tsx (router root)
  types/            # shared TypeScript types
```
