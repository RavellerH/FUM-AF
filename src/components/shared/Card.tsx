import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Card with a standard header row: title on the left, optional action on the right.
export function SectionCard({ title, action, children, className = '' }: SectionCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}
