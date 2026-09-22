import { Plus } from 'lucide-react';
import type { ProductDto } from '../types';
import { formatBs, formatNumber } from '../utils/formatBs';
import { defaultMode, isAccessoryProduct, isMetersProduct, resolveSaleLine } from '../utils/saleUnits';

interface ProductCardProps {
  product: ProductDto;
  onSelect: (product: ProductDto) => void;
}

/**
 * Presentation anchor derived from the product name, matching the buckets the category
 * rail already filters by. It labels how an operator mentally files the material; it does
 * not assert an attribute the API does not carry.
 */
function anchorLabel(product: ProductDto): string | null {
  if (isAccessoryProduct(product)) return 'Herramienta';
  const lower = product.name.toLowerCase();
  if (/nano|polar|carbon|readpower|rayban/.test(lower)) return 'Polarizado';
  if (/vinil|fibra/.test(lower)) return 'Vinil';
  return null;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const isMeters = isMetersProduct(product);
  const isAccessory = isAccessoryProduct(product);
  const isOutOfStock = product.wholesaleQuantity <= 0 && product.retailQuantity <= 0;

  const primaryPrice = resolveSaleLine(product, defaultMode(product), 1).unitPrice;
  const rollPrice = isAccessory ? null : resolveSaleLine(product, 'roll', 1).unitPrice;

  const anchor = anchorLabel(product);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group flex w-full items-start gap-3 rounded-lg bg-zinc-900/50 p-3 text-left transition-colors hover:bg-zinc-800/60 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {anchor && (
            <span className="shrink-0 rounded border border-zinc-700/70 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
              {anchor}
            </span>
          )}
          <span className="truncate text-sm font-semibold text-white">{product.name}</span>
        </div>

        <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-400">{product.sku}</div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            {isAccessory ? 'unidad' : 'metro'}
          </span>
          <span className="text-base font-black tabular-nums text-zinc-50">
            {formatBs(primaryPrice)}
          </span>
          {rollPrice !== null && (
            <span className="text-[11px] text-zinc-400 tabular-nums">
              · rollo {formatBs(rollPrice)}
            </span>
          )}
        </div>

        <div className="mt-1.5 text-[11px] text-zinc-400">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 rounded border border-rose-800/60 bg-rose-950/50 px-1.5 py-0.5 font-semibold text-rose-300">
              Agotado
            </span>
          ) : (
            <>
              <span>Almacén {product.wholesaleQuantity} caj</span>
              <span className="mx-1.5 text-zinc-600" aria-hidden>
                ·
              </span>
              <span className="sr-only">,</span>
              <span>
                Vitrina {formatNumber(product.retailQuantity)} {isMeters ? 'm' : 'un'}
              </span>
            </>
          )}
        </div>
      </div>

      <span
        aria-hidden
        className="mt-0.5 flex w-5 shrink-0 items-center justify-center text-zinc-500 transition-colors group-hover:text-white"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
      </span>
    </button>
  );
}
