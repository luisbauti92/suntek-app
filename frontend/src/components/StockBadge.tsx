import type { StorefrontStockLevel, WarehouseStockLevel } from '../utils/inventoryMetrics';

interface StockBadgeProps {
  level: WarehouseStockLevel | StorefrontStockLevel;
  labels: { full: string; low: string; out: string };
}

export function StockBadge({ level, labels }: StockBadgeProps) {
  const text = level === 'full' ? labels.full : level === 'low' ? labels.low : labels.out;
  const styles =
    level === 'full'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
      : level === 'low'
        ? 'bg-amber-50 text-amber-950 ring-amber-600/25'
        : 'bg-red-50 text-red-800 ring-red-600/20';
  return (
    <span
      className={`inline-flex min-w-[4.5rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {text}
    </span>
  );
}
