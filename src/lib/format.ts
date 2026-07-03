// IDR amounts: no decimals, id-ID locale (project convention).
export function fmt(v: number): string {
  return Math.round(v).toLocaleString('id-ID');
}

// Signed variant using the typographic minus the UI already uses.
export function fmtSigned(v: number): string {
  return `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))}`;
}

// Compact form for chart axis ticks: 1.2M / 350K.
export function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

export function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
