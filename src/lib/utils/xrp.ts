const DROPS_PER_XRP = 1_000_000;

export function dropsToXrp(drops: number): number {
  return drops / DROPS_PER_XRP;
}

export function xrpToDrops(xrp: number): number {
  return Math.round(xrp * DROPS_PER_XRP);
}

export function formatXrp(drops: number): string {
  const xrp = dropsToXrp(drops);
  if (xrp >= 1000) {
    return `${xrp.toLocaleString("en-US", { maximumFractionDigits: 2 })} XRP`;
  }
  return `${xrp.toLocaleString("en-US", { maximumFractionDigits: 6 })} XRP`;
}
