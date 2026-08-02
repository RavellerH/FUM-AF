import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../hooks/useTransactions';
import { useSummary } from '../../hooks/useSummary';
import { fileToText, parseTransactionsWithGemini } from '../../lib/gemini';
import { useRules, applyRules } from '../../hooks/useRules';
import { useFilePassword } from '../../hooks/useFilePassword';
import { PageHeader } from '../shared/PageHeader';
import type { ParsedTransaction } from '../../types';
import { DropZone } from './DropZone';
import { RawPreview } from './RawPreview';
import { ParseProgress } from './ParseProgress';
import { ParsedPreviewTable } from './ParsedPreviewTable';
import { ErrorBanner } from '../shared/ErrorBanner';

type Step = 'idle' | 'needs-password' | 'previewing' | 'parsing' | 'confirming' | 'saving' | 'done';

function isPasswordError(e: unknown) {
  const msg = e instanceof Error ? e.message.toLowerCase() : '';
  return msg.includes('password') || msg.includes('encrypted');
}

export function UploadPage() {
  const { insertTransactions } = useTransactions();
  const { buildAndUpsertSummary } = useSummary();
  const { rules, fetchRules } = useRules();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [rulesApplied, setRulesApplied] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { password: savedPassword, setPassword: persistPassword } = useFilePassword();
  const [password, setPassword] = useState(savedPassword);

  useEffect(() => { fetchRules(); }, []);

  const readFile = async (f: File, pwd?: string) => {
    const text = await fileToText(f, pwd || undefined);
    if (pwd) {
      persistPassword(pwd);
      setPassword(pwd);
    }
    setRawText(text);
    setStep('previewing');
  };

  const handleFile = async (f: File) => {
    setError(null);
    setFile(f);
    try {
      await readFile(f, savedPassword || undefined);
    } catch (e) {
      if (isPasswordError(e)) {
        setStep('needs-password');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to read file');
      }
    }
  };

  const handlePasswordSubmit = async () => {
    if (!file) return;
    setError(null);
    try {
      await readFile(file, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unlock file — check the password');
    }
  };

  const handleParse = async () => {
    if (!rawText) return;
    setStep('parsing');
    setError(null);
    try {
      const result = await parseTransactionsWithGemini(rawText);
      const withRules = applyRules(result, rules);
      const count = withRules.filter((t, i) =>
        t.category !== result[i].category || t.type !== result[i].type
      ).length;
      setParsed(withRules);
      setRulesApplied(count);
      setStep('confirming');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gemini parsing failed');
      setStep('previewing');
    }
  };

  const handleConfirm = async () => {
    if (!file || !parsed.length) return;
    setStep('saving');
    setError(null);
    try {
      await insertTransactions(parsed, file.name);
      const months = [...new Set(parsed.map(t => t.date.slice(0, 7)))];
      await Promise.all(months.map(m => buildAndUpsertSummary(m)));
      setStep('done');
      setTimeout(() => navigate('/transactions'), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save transactions');
      setStep('confirming');
    }
  };

  const reset = () => {
    setStep('idle');
    setFile(null);
    setRawText('');
    setParsed([]);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Upload Transactions" subtitle="Mandiri statement PDF, CSV, or Excel" />

      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError(null)} /></div>}

      {step === 'idle' && <DropZone onFile={handleFile} />}

      {step === 'needs-password' && file && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="mb-1 text-sm font-semibold text-amber-900">File is password-protected</p>
          <p className="mb-4 text-xs text-amber-700">{file.name}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Enter file password"
              autoFocus
              className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:flex-none"
              >
                Unlock
              </button>
              <button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 sm:flex-none">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {(step === 'previewing' || step === 'parsing' || step === 'confirming' || step === 'saving' || step === 'done') && file && (
        <div className="flex flex-col gap-4">
          {(step === 'parsing' || step === 'saving' || step === 'done') && (
            <ParseProgress
              stage={step === 'parsing' ? 'parsing' : step === 'saving' ? 'saving' : 'done'}
              count={parsed.length}
            />
          )}

          {step !== 'done' && <RawPreview text={rawText} fileName={file.name} />}

          {step === 'confirming' && rulesApplied > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
              <svg className="h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span><strong>{rulesApplied}</strong> transaction{rulesApplied !== 1 ? 's' : ''} auto-categorized by your rules</span>
            </div>
          )}

          {step === 'confirming' && <ParsedPreviewTable transactions={parsed} />}

          {(step === 'previewing' || step === 'confirming') && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              {step === 'previewing' && (
                <button onClick={handleParse} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Parse with Gemini
                </button>
              )}
              {step === 'confirming' && (
                <button onClick={handleConfirm} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  Save {parsed.length} transactions
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
