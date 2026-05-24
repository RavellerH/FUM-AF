import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useSummary } from '../../hooks/useSummary';
import { fileToText, parseTransactionsWithGemini } from '../../lib/gemini';
import type { ParsedTransaction } from '../../types';
import { DropZone } from './DropZone';
import { RawPreview } from './RawPreview';
import { ParseProgress } from './ParseProgress';
import { ParsedPreviewTable } from './ParsedPreviewTable';
import { ErrorBanner } from '../shared/ErrorBanner';

type Step = 'idle' | 'needs-password' | 'previewing' | 'parsing' | 'confirming' | 'saving' | 'done';

const PASSWORD_KEY = 'fum_file_password';

function isPasswordError(e: unknown) {
  const msg = e instanceof Error ? e.message.toLowerCase() : '';
  return msg.includes('password') || msg.includes('encrypted');
}

export function UploadPage() {
  const { session } = useAuth();
  const { insertTransactions } = useTransactions();
  const { buildAndUpsertSummary } = useSummary();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState(() => localStorage.getItem(PASSWORD_KEY) ?? '');

  const readFile = async (f: File, pwd?: string) => {
    const text = await fileToText(f, pwd || undefined);
    if (pwd) {
      localStorage.setItem(PASSWORD_KEY, pwd);
      setPassword(pwd);
    }
    setRawText(text);
    setStep('previewing');
  };

  const handleFile = async (f: File) => {
    setError(null);
    setFile(f);
    const saved = localStorage.getItem(PASSWORD_KEY) || undefined;
    try {
      await readFile(f, saved);
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
      setParsed(result);
      setStep('confirming');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gemini parsing failed');
      setStep('previewing');
    }
  };

  const handleConfirm = async () => {
    if (!session || !file || !parsed.length) return;
    setStep('saving');
    setError(null);
    try {
      await insertTransactions(parsed, file.name, session.user.id);
      const months = [...new Set(parsed.map(t => t.date.slice(0, 7)))];
      await Promise.all(months.map(m => buildAndUpsertSummary(m, session.user.id)));
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Upload Transactions</h1>

      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError(null)} /></div>}

      {step === 'idle' && <DropZone onFile={handleFile} />}

      {step === 'needs-password' && file && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="mb-1 text-sm font-semibold text-amber-900">File is password-protected</p>
          <p className="mb-4 text-xs text-amber-700">{file.name}</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Enter file password"
              autoFocus
              className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handlePasswordSubmit}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Unlock
            </button>
            <button onClick={reset} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
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

          {step === 'confirming' && <ParsedPreviewTable transactions={parsed} />}

          {(step === 'previewing' || step === 'confirming') && (
            <div className="flex gap-3">
              <button onClick={reset} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              {step === 'previewing' && (
                <button onClick={handleParse} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Parse with Gemini
                </button>
              )}
              {step === 'confirming' && (
                <button onClick={handleConfirm} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
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
