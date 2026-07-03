export const FALLBACK_USD_IDR = 16500;

let cache: { rate: number; at: number } | null = null;
const TTL_MS = 10 * 60 * 1000;

// USD→IDR spot rate, cached for 10 minutes so Analysis and Portfolio
// don't each hit the API on every mount.
export async function fetchUsdIdr(): Promise<number> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rate;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const json = await res.json();
    const rate = json?.rates?.IDR;
    if (typeof rate !== 'number' || !isFinite(rate)) throw new Error('bad rate');
    cache = { rate, at: Date.now() };
    return rate;
  } catch {
    return cache?.rate ?? FALLBACK_USD_IDR;
  }
}
