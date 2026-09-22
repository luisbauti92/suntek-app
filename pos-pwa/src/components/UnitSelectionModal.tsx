import { useState } from 'react';
import { X, Plus, Minus, Check, Ruler, Scroll, Package, Tag } from 'lucide-react';
import type { ProductDto, CartItem, SaleMode } from '../types';
import { formatBs, formatNumber } from '../utils/formatBs';
import {
  availableModes,
  defaultMode,
  describeQuantity,
  isAccessoryProduct,
  isMetersProduct,
  modeLabel,
  resolveSaleLine,
} from '../utils/saleUnits';

interface UnitSelectionModalProps {
  product: ProductDto | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

const MODE_ICON: Record<SaleMode, typeof Ruler> = {
  meter: Ruler,
  roll: Scroll,
  box: Package,
  unit: Tag,
};

export function UnitSelectionModal({ product, onClose, onAddToCart }: UnitSelectionModalProps) {
  if (!product) return null;

  return <UnitSelectionSheet key={product.id} product={product} onClose={onClose} onAddToCart={onAddToCart} />;
}

function UnitSelectionSheet({
  product,
  onClose,
  onAddToCart,
}: {
  product: ProductDto;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const isMeters = isMetersProduct(product);
  const isAccessory = isAccessoryProduct(product);
  const modes = availableModes(product);

  const [mode, setMode] = useState<SaleMode>(() => defaultMode(product));
  const [quantity, setQuantity] = useState<number>(1);

  const line = resolveSaleLine(product, mode, quantity);
  const { unitPrice, unitLabel, deductedQuantity, subtotal } = line;

  function adjustQuantity(delta: number) {
    setQuantity((prev) => {
      const step = mode === 'meter' && prev <= 1 ? 0.5 : 1;
      const next = Math.max(step, prev + delta * step);
      return Number(next.toFixed(2));
    });
  }

  function handleConfirm() {
    if (quantity <= 0) return;

    const item: CartItem = {
      cartId: `${product.id}-${mode}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: deductedQuantity,
      saleType: line.saleType,
      unitLabel: describeQuantity(quantity, unitLabel),
      unitPrice,
      subtotal,
      mode,
      enteredQuantity: quantity,
    };

    onAddToCart(item);
    onClose();
  }

  const quickChips = mode === 'meter' ? [0.5, 1, 2, 3, 5, 10] : [1, 2, 3, 5, 10];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] p-5 pb-safe-sheet shadow-2xl text-white max-h-[85vh] flex flex-col space-y-4">
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2"></div>

        <div className="flex items-start justify-between">
          <div className="pr-4">
            <h2 className="text-base font-bold text-white leading-snug">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-300">
              <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50 text-[10px]">
                {product.sku}
              </span>
              <span className="text-zinc-500">•</span>
              <span>
                Almacén: <strong className="text-white">{product.wholesaleQuantity}</strong> caj
              </span>
              <span className="text-zinc-500">•</span>
              <span>
                Vitrina: <strong className="text-white">{formatNumber(product.retailQuantity)}</strong>{' '}
                {isMeters ? 'm' : 'un'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selección de unidad"
            className="w-11 h-11 rounded-full bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 flex items-center justify-center shrink-0 border border-zinc-700/50"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        <div>
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-2">
            Tipo de venta
          </span>
          {isAccessory ? (
            <div className="p-3.5 rounded-2xl bg-[#0038a8] text-white font-bold text-xs flex items-center justify-between border border-blue-400/30">
              <span className="text-sm font-extrabold flex items-center gap-2">
                <Tag className="w-4 h-4" aria-hidden /> Por unidad
              </span>
              <span className="text-sm font-black tabular-nums">{formatBs(unitPrice)}</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {modes.map((m) => {
                const Icon = MODE_ICON[m];
                const price = resolveSaleLine(product, m, 1).unitPrice;
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setMode(m);
                      setQuantity(1);
                    }}
                    className={`min-h-[56px] p-2.5 rounded-2xl font-bold text-xs text-center border transition-all active:scale-[0.97] flex flex-col items-center justify-center gap-0.5 ${
                      active
                        ? 'bg-[#0038a8] border-blue-400/40 text-white shadow-sm'
                        : 'bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <span className="font-extrabold flex items-center gap-1.5">
                      <Icon className="w-4 h-4" aria-hidden /> {modeLabel(m)}
                    </span>
                    <span className="text-[11px] opacity-90 font-medium tabular-nums">
                      {formatBs(price)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-2">
            Atajos de cantidad
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickChips.map((val) => (
              <button
                key={val}
                type="button"
                aria-pressed={quantity === val}
                onClick={() => setQuantity(val)}
                className={`min-h-11 px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 border transition-all active:scale-95 ${
                  quantity === val
                    ? 'bg-[#0038a8]/30 border-blue-500 text-blue-200 shadow-sm'
                    : 'bg-zinc-800/90 border-zinc-700/60 text-zinc-300 active:bg-zinc-700'
                }`}
              >
                {val} {mode === 'meter' ? 'm' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              Cantidad
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                aria-label="Restar cantidad"
                onClick={() => adjustQuantity(-1)}
                className="w-11 h-11 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-black text-base flex items-center justify-center active:scale-90 transition border border-zinc-600/60"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" aria-hidden />
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                inputMode="decimal"
                aria-label="Cantidad"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-16 min-h-11 text-center font-black text-lg bg-transparent text-white focus:outline-none border-b-2 border-zinc-600 focus:border-[#0038a8] pb-0.5 tabular-nums"
              />
              <button
                type="button"
                aria-label="Sumar cantidad"
                onClick={() => adjustQuantity(1)}
                className="w-11 h-11 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-black text-base flex items-center justify-center active:scale-90 transition border border-zinc-600/60"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden />
              </button>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              Subtotal
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1 tabular-nums">
              {formatBs(subtotal)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full bg-[#0038a8] hover:bg-[#0048d1] active:scale-[0.98] text-white min-h-[52px] py-3.5 rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 border border-blue-400/30"
        >
          <Check className="w-5 h-5 stroke-[2.5]" aria-hidden />
          <span>Añadir al ticket ({formatBs(subtotal)})</span>
        </button>
      </div>
    </div>
  );
}
