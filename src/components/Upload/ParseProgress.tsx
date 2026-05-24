import { Spinner } from '../shared/Spinner';

type Stage = 'parsing' | 'saving' | 'done';

interface Props {
  stage: Stage;
  count?: number;
}

const MESSAGES: Record<Stage, string> = {
  parsing: 'Sending to Gemini for analysis...',
  saving: 'Saving transactions to database...',
  done: 'All done!',
};

export function ParseProgress({ stage, count }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
      {stage !== 'done' ? <Spinner size="sm" /> : (
        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span className="text-sm text-blue-800">
        {MESSAGES[stage]}
        {stage === 'saving' && count !== undefined && ` (${count} transactions)`}
      </span>
    </div>
  );
}
