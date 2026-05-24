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
   - category: string (best-guess from: Food & Dining, Transport, Utilities, Housing, Healthcare, Entertainment, Shopping, Income, Uncategorized)
   - description: string (merchant name or memo, max 100 chars)
   - currency: string (3-letter ISO code, default "IDR" if unknown or Indonesian data)
3. Ignore header rows, balance rows, and summary rows.
4. For credit card statements: purchases are "expense", payments/refunds are "income".
5. Infer type from amount sign if present: negative = expense, positive = income. Then normalize amount to positive.
6. If a date is ambiguous (MM/DD vs DD/MM), prefer DD/MM/YYYY for Indonesian banks.

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

export async function parseTransactionsWithGemini(rawText: string): Promise<ParsedTransaction[]> {
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(buildPrompt(rawText));
  const text = result.response.text();
  return extractJsonArray(text);
}
