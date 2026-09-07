import { Plus } from 'lucide-react';
import type { ProductDto } from '../types';
import { formatBs, formatNumber } from '../utils/formatBs';

interface ProductCardProps {
  product: ProductDto;
  onSelect: (product: ProductDto) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const isMeters = product.unitType === 'Meters' || product.unitType === 0;
  const isAccessory = !isMeters && product.rollsPerBox <= 1;

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-zinc-900 border border-zinc-800/80 active:border-violet-500 rounded-2xl p-3.5 flex items-center justify-between gap-3 active:scale-[0.99] transition cursor-pointer shadow-sm hover:border-zinc-700"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-white truncate">{product.name}</h3>
          <span className="text-[10px] text-zinc-500 font-mono shrink-0">{product.sku}</span>
        </div>

        <div className="flex items-center gap-2 mt-1 text-[11px]">
          {isAccessory ? (
            <span className="text-emerald-400 font-bold">{formatBs(product.pricePerRoll)} / un</span>
          ) : (
            <>
              <span className="text-zinc-400">
                M: <strong className="text-emerald-400 font-bold">{formatBs(product.pricePerMeter)}</strong>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                Rollo: <strong className="text-slate-200 font-bold">{formatBs(product.pricePerRoll)}</strong>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
          <span>
            📦 Almacén: <strong className="text-zinc-300 font-semibold">{product.wholesaleQuantity} caj</strong>
          </span>
          <span className="text-zinc-600">•</span>
          <span>
            🏪 Vitrina:{' '}
            <strong className="text-zinc-300 font-semibold">
              {formatNumber(product.retailQuantity)} {isMeters ? 'm' : 'un'}
            </strong>
          </span>
        </div>
      </div>

      <button
        type="button"
        className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-sm shrink-0 active:bg-violet-600 active:text-white transition"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
