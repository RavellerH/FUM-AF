# FUM-AF — Personal Finance Tracker

A personal finance web app for importing, categorizing, and analyzing Indonesian bank statements (BCA, Mandiri, etc.). Built for one user, runs entirely in the browser, data stored in Supabase.

**Live app:** https://ravellerh.github.io/FUM-AF

---

## What it does

- **Upload bank statements** — drag-and-drop PDF or Excel files; password-protected PDFs supported
- **AI-powered parsing** — Gemini extracts transactions (date, amount, currency, description, type) from raw statement text
- **Categorize transactions** — click any category or type badge in the table to edit it inline; 21 categories available
- **Filter & browse** — filter by month, transaction type (income/expense), or category
- **Date-grouped view** — transactions are grouped by date with a header row showing day and count, making bulk annotation easy
- **Dashboard & summaries** — monthly income vs. expense charts and per-category breakdowns
- **Secure** — email whitelist via Supabase Auth; only approved accounts can log in

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| AI parsing | Google Gemini API |
| PDF parsing | pdf.js |
| Excel parsing | SheetJS (xlsx) |
| Charts | Recharts |
| Hosting | GitHub Pages |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Required environment variables:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_ALLOWED_EMAIL=
```

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via GitHub Actions. The workflow builds the Vite app and publishes `./dist` using `peaceiris/actions-gh-pages`.

Secrets required in the repository settings: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`, `VITE_ALLOWED_EMAIL`.

## Project structure

```
src/
  components/
    Dashboard/       # charts and summary cards
    Transactions/    # table, filters, inline editing
    Upload/          # drag-and-drop, PDF/Excel parsing, Gemini call
    shared/          # Spinner, ErrorBanner, etc.
  hooks/             # useAuth, useTransactions, useCategories, useSummaries
  lib/               # supabase client, gemini client
  types/             # shared TypeScript types
```
