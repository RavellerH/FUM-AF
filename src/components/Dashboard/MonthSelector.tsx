interface Props {
  months: string[];
  value: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ months, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-card focus:border-brand-500 focus:outline-none"
    >
      {months.map(m => (
        <option key={m} value={m}>{m}</option>
      ))}
      {!months.length && <option value="">No data</option>}
    </select>
  );
}
