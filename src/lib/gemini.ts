import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import type { ParsedTransaction } from '../types';

const gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);

async function pdfToText(buffer: ArrayBuffer, password?: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    ...(password ? { password } : {}),
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '));
  }
  return pages.join('\n');
}

export async function fileToText(file: File, password?: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (ext === 'csv') {
    return new TextDecoder().decode(buffer);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const opts: XLSX.ParsingOptions = { type: 'array', sheetRows: 1000 };
    if (password) opts.password = password;
    const workbook = XLSX.read(new Uint8Array(buffer), opts);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(sheet);
  }
  if (ext === 'pdf') {
    return pdfToText(buffer, password);
  }
  throw new Error(`Unsupported file type: .${ext}. Please upload a CSV, Excel, or PDF file.`);
}

const buildPrompt = (rawText: string) => `
You are a financial data parser. Parse the following bank statement or transaction export into structured JSON.

Rules:
1. Return ONLY a valid JSON array — no markdown, no explanation, no code fences.
2. Each element must have exactly these fields:
   - date: string (ISO 8601, YYYY-MM-DD)
   - amount: number (always positive)
   - type: "income" | "expense"
   - category: string (best-guess from: Food & Dining, Transport, Utilities, Housing, Healthcare, Insurance, Household, Entertainment, Shopping, Admin Fee, Income, Uncategorized)
   - description: string (merchant name or memo, max 100 chars)
   - currency: string (3-letter ISO code, default "IDR" if unknown or Indonesian data)
3. Ignore header rows, balance rows, and summary rows.
4. For credit card statements: purchases are "expense", payments/refunds are "income".
5. Infer type from amount sign if present: negative = expense, positive = income. Then normalize amount to positive.
6. If a date is ambiguous (MM/DD vs DD/MM), prefer DD/MM/YYYY for Indonesian banks.
7. Minimarkets/convenience stores (Alfamart, Alfagift, Indomaret, Yomart) and supermarkets/grocery stores are "Household", not "Shopping" — regardless of amount.
8. Small bank-charged fees (e.g. "Biaya transaksi bank", "Biaya admin", virtual-account/top-up admin fees) are "Admin Fee", not the category of the payment they're attached to.
9. BPJS and other health/life insurance premium payments are "Insurance", not "Healthcare".

Raw data:
${rawText}

Return only the JSON array:
`.trim();

function extractJsonArray(text: string): ParsedTransaction[] {
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\n?/gi, '').trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Gemini did not return a valid JSON array. Try again or check the file format.');
  return JSON.parse(match[0]) as ParsedTransaction[];
}

// gemini-1.5-* is retired for new usage; 2.5-flash is the current fast tier.
const GEMINI_MODEL = 'gemini-2.5-flash';

export async function parseTransactionsWithGemini(rawText: string): Promise<ParsedTransaction[]> {
  const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(buildPrompt(rawText));
  const text = result.response.text();
  return extractJsonArray(text);
}

export interface AIInsight {
  type: 'warning' | 'positive' | 'info';
  title: string;
  body: string;
}

export async function generateSpendingInsights(
  months: Array<{
    label: string;
    month: string;
    income: number;
    expense: number;
    net: number;
    byCategory: Record<string, number>;
  }>,
  allTimeCats: Record<string, number>,
): Promise<AIInsight[]> {
  if (!months.length) return [];

  const fmtIDR = (n: number) => Math.round(n).toLocaleString('id-ID');

  const monthLines = months.map(m => {
    const cats = Object.entries(m.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([k, v]) => `${k}: ${fmtIDR(v)}`)
      .join(', ');
    return `  ${m.month} (${m.label}): income=${fmtIDR(m.income)} expense=${fmtIDR(m.expense)} net=${m.net >= 0 ? '+' : ''}${fmtIDR(m.net)} | ${cats}`;
  }).join('\n');

  const catSummary = Object.entries(allTimeCats)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `${k}: ${fmtIDR(v)}`)
    .join(', ');

  const prompt = `You are a personal finance analyst for an Indonesian household. All amounts are in IDR (Indonesian Rupiah).

Monthly spending data:
${monthLines}

All-time totals by category: ${catSummary}

Generate 5 specific financial insights about this spending data. Rules:
1. Return ONLY a valid JSON array — no markdown fences, no explanation.
2. Schema: [{ "type": "warning"|"positive"|"info", "title": "<60 chars", "body": "2-3 sentences with actual IDR amounts, month names, percentage changes" }]
3. Be concrete — every insight must cite actual numbers from the data above. No generic advice.
4. Cover a variety: biggest category trend, month-over-month change, savings rate, an anomalous month if any, one actionable suggestion.
5. Context: IDR 5–10M/month expense is normal for Indonesian middle-class. Savings rate = net/income.

Return only the JSON array:`.trim();

  const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const stripped = text.replace(/```(?:json)?\n?/gi, '').trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in Gemini response');
  return JSON.parse(match[0]) as AIInsight[];
}
