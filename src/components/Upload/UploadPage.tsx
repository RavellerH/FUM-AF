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

type Step = 'idle' | 'previewing' | 'parsing' | 'confirming' | 'saving' | 'done';

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

  const handleFile = async (f: File) => {
    setError(null);
    setFile(f);
    try {
      const pwd = localStorage.getItem('fum_file_password') || undefined;
      const text = await fileToText(f, pwd);
      setRawText(text);
      setStep('previewing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file');
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
      // Rebuild summaries for all affected months
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

      {step === 'idle' && (
        <DropZone onFile={handleFile} />
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
              <button
                onClick={reset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {step === 'previewing' && (
                <button
                  onClick={handleParse}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Parse with Gemini
                </button>
              )}
              {step === 'confirming' && (
                <button
                  onClick={handleConfirm}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
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
