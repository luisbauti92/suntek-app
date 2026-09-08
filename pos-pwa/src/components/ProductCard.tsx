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
  const isOutOfStock = product.wholesaleQuantity <= 0 && product.retailQuantity <= 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-zinc-900 border border-zinc-800/90 active:border-[#0038a8] rounded-2xl p-3.5 flex items-center justify-between gap-3 active:scale-[0.985] transition cursor-pointer shadow-sm hover:border-zinc-700"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-white truncate">{product.name}</h3>
          <span className="text-[10px] text-zinc-400 font-mono shrink-0 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50">
            {product.sku}
          </span>
        </div>

        {/* Pricing row with high contrast tabular numbers */}
        <div className="flex items-center gap-2 mt-1.5 text-xs">
          {isAccessory ? (
            <span className="text-emerald-400 font-black tabular-nums">{formatBs(product.pricePerRoll)} / un</span>
          ) : (
            <>
              <span className="text-zinc-300 font-medium">
                M: <strong className="text-emerald-400 font-black tabular-nums">{formatBs(product.pricePerMeter)}</strong>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-medium">
                Rollo: <strong className="text-white font-bold tabular-nums">{formatBs(product.pricePerRoll)}</strong>
              </span>
            </>
          )}
        </div>

        {/* Stock counters */}
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400">
          {isOutOfStock ? (
            <span className="text-rose-400 font-bold text-[10px] bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60">
              Agotado
            </span>
          ) : (
            <>
              <span>
                📦 Almacén: <strong className="text-zinc-200 font-semibold">{product.wholesaleQuantity} caj</strong>
              </span>
              <span className="text-zinc-600">•</span>
              <span>
                🏪 Vitrina:{' '}
                <strong className="text-zinc-200 font-semibold">
                  {formatNumber(product.retailQuantity)} {isMeters ? 'm' : 'un'}
                </strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 44px thumb touch target with physical feedback */}
      <button
        type="button"
        aria-label={`Seleccionar ${product.name}`}
        className="w-11 h-11 rounded-2xl bg-[#0038a8]/20 text-blue-200 border border-[#0038a8]/50 flex items-center justify-center font-bold text-base shrink-0 active:bg-[#0038a8] active:text-white active:scale-90 transition shadow-sm"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}
