import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
