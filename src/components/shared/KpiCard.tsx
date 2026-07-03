export type KpiTone = 'default' | 'positive' | 'negative' | 'warning' | 'info';

const TONES: Record<KpiTone, { card: string; label: string; value: string; note: string }> = {
  default:  { card: 'border-slate-200/80 bg-white',    label: 'text-slate-400',   value: 'text-slate-900',   note: 'text-slate-400' },
  positive: { card: 'border-emerald-200 bg-emerald-50', label: 'text-emerald-700', value: 'text-emerald-700', note: 'text-emerald-600/70' },
  negative: { card: 'border-rose-200 bg-rose-50',       label: 'text-rose-700',    value: 'text-rose-600',    note: 'text-rose-500/70' },
  warning:  { card: 'border-amber-200 bg-amber-50',     label: 'text-amber-700',   value: 'text-amber-700',   note: 'text-amber-600/70' },
  info:     { card: 'border-brand-200 bg-brand-50',     label: 'text-brand-700',   value: 'text-brand-700',   note: 'text-brand-600/70' },
};

interface Props {
  label: string;
  value: string;
  note?: string;
  tone?: KpiTone;
  valueTone?: KpiTone; // override just the number's colour on a default card
}

export function KpiCard({ label, value, note, tone = 'default', valueTone }: Props) {
  const t = TONES[tone];
  const valueCls = valueTone ? TONES[valueTone].value : t.value;
  return (
    <div className={`rounded-2xl border p-4 shadow-card sm:p-5 ${t.card}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${t.label}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${valueCls}`}>{value}</p>
      {note && <p className={`mt-1 text-xs ${t.note}`}>{note}</p>}
    </div>
  );
}
