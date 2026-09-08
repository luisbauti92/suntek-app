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

  // Visual category anchor
  const lower = product.name.toLowerCase();
  let anchorBadge = null;
  if (isAccessory) {
    anchorBadge = (
      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 shrink-0">
        🛠️ Herramienta
      </span>
    );
  } else if (lower.includes('nano') || lower.includes('polar') || lower.includes('carbon') || lower.includes('readpower')) {
    const pctMatch = product.name.match(/\b(05%|15%|20%|35%|50%|70%)\b/i);
    anchorBadge = (
      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 shrink-0">
        🕶️ {pctMatch ? pctMatch[0] : 'Polarizado'}
      </span>
    );
  } else if (lower.includes('vinil') || lower.includes('fibra')) {
    anchorBadge = (
      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 shrink-0">
        🎨 Vinil
      </span>
    );
  }

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-zinc-900/95 border border-zinc-800/90 active:border-[#0038a8] rounded-2xl p-3.5 flex items-center justify-between gap-3 active:scale-[0.985] transition cursor-pointer shadow-sm hover:border-zinc-700/80"
    >
      <div className="flex-1 min-w-0">
        {/* Header with name and visual anchor */}
        <div className="flex items-center gap-1.5">
          {anchorBadge}
          <h3 className="text-xs font-bold text-white truncate">{product.name}</h3>
        </div>

        {/* Tactile Price Pills for instant scanability */}
        <div className="flex items-center gap-2 mt-2">
          {isAccessory ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-400/80">Unidad</span>
              <span className="text-xs font-black tabular-nums">{formatBs(product.pricePerRoll)}</span>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-emerald-400/80">Metro</span>
                <span className="text-xs font-black tabular-nums">{formatBs(product.pricePerMeter)}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                <span className="text-[10px] text-zinc-400 font-medium">Rollo:</span>
                <span className="text-xs font-bold tabular-nums text-white">{formatBs(product.pricePerRoll)}</span>
              </div>
            </>
          )}
        </div>

        {/* Stock counters */}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
          {isOutOfStock ? (
            <span className="text-rose-400 font-bold text-[10px] bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-800/60">
              Agotado
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                Almacén: <strong className="text-zinc-200 font-semibold">{product.wholesaleQuantity} caj</strong>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Vitrina:{' '}
                <strong className="text-zinc-200 font-semibold">
                  {formatNumber(product.retailQuantity)} {isMeters ? 'm' : 'un'}
                </strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tactile button with illuminated top border and depth */}
      <button
        type="button"
        aria-label={`Seleccionar ${product.name}`}
        className="w-11 h-11 rounded-2xl bg-[#0038a8] text-white border-t border-white/25 border-x border-b border-[#002673] shadow-[0_4px_14px_rgba(0,56,168,0.4)] flex items-center justify-center font-bold text-base shrink-0 active:scale-90 active:shadow-none transition-all"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}
