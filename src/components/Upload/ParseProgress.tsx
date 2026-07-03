import { useEffect, useState } from 'react';

type Stage = 'parsing' | 'saving' | 'done';

interface Props {
  stage: Stage;
  count?: number;
}

const STAGE_CONFIG: Record<Stage, { label: string; sub: string; target: number; color: string }> = {
  parsing: {
    label: 'Analysing with Gemini',
    sub: 'Reading transactions from your file...',
    target: 85,
    color: 'bg-brand-500',
  },
  saving: {
    label: 'Saving to database',
    sub: 'Writing transactions...',
    target: 95,
    color: 'bg-brand-500',
  },
  done: {
    label: 'Complete',
    sub: '',
    target: 100,
    color: 'bg-emerald-500',
  },
};

export function ParseProgress({ stage, count }: Props) {
  const [animated, setAnimated] = useState(5);
  const config = STAGE_CONFIG[stage];
  const isDone = stage === 'done';

  useEffect(() => {
    if (stage === 'done') return;

    const target = STAGE_CONFIG[stage].target;
    const interval = setInterval(() => {
      setAnimated(prev => {
        if (prev >= target) return prev;
        // Slow down as we approach the target
        const remaining = target - prev;
        const step = Math.max(0.3, remaining * 0.04);
        return Math.min(target, prev + step);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [stage]);

  // 'done' renders at 100% directly instead of waiting for the animation.
  const progress = isDone ? 100 : animated;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{config.label}</p>
          {!isDone && (
            <p className="mt-0.5 text-xs text-slate-500">{config.sub}</p>
          )}
          {isDone && count !== undefined && (
            <p className="mt-0.5 text-xs text-slate-500">
              {count} transaction{count !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        {isDone ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        ) : (
          <span className="text-sm font-mono font-medium text-slate-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${config.color}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {!isDone && (
        <div className="mt-3 flex gap-4">
          {(['parsing', 'saving'] as Stage[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${stage === s ? 'bg-brand-500' : 'bg-slate-200'}`} />
              <span className={`text-xs ${stage === s ? 'font-medium text-brand-600' : 'text-slate-400'}`}>
                {s === 'parsing' ? 'Parse' : 'Save'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
