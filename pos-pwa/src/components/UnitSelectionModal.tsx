import { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import type { ProductDto, CartItem, SaleType } from '../types';
import { formatBs, formatNumber } from '../utils/formatBs';

interface UnitSelectionModalProps {
  product: ProductDto | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

type Mode = 'meter' | 'roll' | 'box' | 'unit';

export function UnitSelectionModal({ product, onClose, onAddToCart }: UnitSelectionModalProps) {
  if (!product) return null;

  const isMeters = product.unitType === 'Meters' || product.unitType === 0;
  const isAccessory = !isMeters && product.rollsPerBox <= 1;

  const [mode, setMode] = useState<Mode>(isAccessory ? 'unit' : 'meter');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    setMode(isAccessory ? 'unit' : 'meter');
    setQuantity(1);
  }, [product, isAccessory]);

  // Unit price determination based on selected mode
  let unitPrice = 0;
  let saleType: SaleType = 'Retail';
  let deductedQuantity = quantity;
  let unitLabel = 'mt';

  if (mode === 'meter') {
    unitPrice = product.pricePerMeter;
    saleType = 'Retail';
    deductedQuantity = quantity;
    unitLabel = 'mt';
  } else if (mode === 'roll') {
    unitPrice = product.pricePerRoll;
    if (product.rollsPerBox === 1) {
      saleType = 'Wholesale';
      deductedQuantity = quantity;
      unitLabel = 'rollo';
    } else {
      saleType = 'Retail';
      deductedQuantity = quantity * (product.length > 0 ? product.length : 1);
      unitLabel = 'rollo';
    }
  } else if (mode === 'box') {
    unitPrice = product.pricePerRoll * (product.rollsPerBox > 0 ? product.rollsPerBox : 1);
    saleType = 'Wholesale';
    deductedQuantity = quantity;
    unitLabel = 'caja';
  } else if (mode === 'unit') {
    unitPrice = product.pricePerRoll > 0 ? product.pricePerRoll : product.pricePerMeter;
    saleType = 'Retail';
    deductedQuantity = quantity;
    unitLabel = 'un';
  }

  const subtotal = quantity * unitPrice;

  function handleQuickChip(val: number) {
    setQuantity(val);
  }

  function adjustQuantity(delta: number) {
    setQuantity((prev) => {
      const step = mode === 'meter' && prev <= 1 ? 0.5 : 1;
      const next = Math.max(step, prev + delta * step);
      return Number(next.toFixed(2));
    });
  }

  function handleConfirm() {
    if (!product || quantity <= 0) return;

    const item: CartItem = {
      cartId: `${product.id}-${mode}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: deductedQuantity,
      saleType,
      unitLabel: `${quantity} ${unitLabel}`,
      unitPrice,
      subtotal: Number(subtotal.toFixed(2)),
    };

    onAddToCart(item);
    onClose();
  }

  const quickChips = mode === 'meter' ? [0.5, 1, 2, 3, 5, 10] : [1, 2, 3, 5, 10];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] p-5 pb-safe-sheet shadow-2xl text-white max-h-[85vh] flex flex-col space-y-4">
        {/* Handle bar */}
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2"></div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="pr-4">
            <h2 className="text-base font-bold text-white leading-snug">{product.name}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
              <span className="font-mono">{product.sku}</span>
              <span>•</span>
              <span>
                Almacén: {product.wholesaleQuantity} caj | Vitrina: {formatNumber(product.retailQuantity)}{' '}
                {isMeters ? 'm' : 'un'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unit Selector Tabs */}
        <div>
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Tipo de Venta
          </label>
          {isAccessory ? (
            <div className="p-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-between">
              <span>🏷️ Por Unidad</span>
              <span>{formatBs(unitPrice)}</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('meter');
                  setQuantity(1);
                }}
                className={`p-2.5 rounded-2xl font-bold text-xs text-center border transition flex flex-col items-center gap-0.5 ${
                  mode === 'meter'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                }`}
              >
                <span>📏 Metro</span>
                <span className="text-[10px] opacity-90 font-normal">{formatBs(product.pricePerMeter)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('roll');
                  setQuantity(1);
                }}
                className={`p-2.5 rounded-2xl font-bold text-xs text-center border transition flex flex-col items-center gap-0.5 ${
                  mode === 'roll'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                }`}
              >
                <span>📜 Rollo</span>
                <span className="text-[10px] opacity-90 font-normal">{formatBs(product.pricePerRoll)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('box');
                  setQuantity(1);
                }}
                className={`p-2.5 rounded-2xl font-bold text-xs text-center border transition flex flex-col items-center gap-0.5 ${
                  mode === 'box'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                }`}
              >
                <span>📦 Caja ({product.rollsPerBox} rol)</span>
                <span className="text-[10px] opacity-90 font-normal">
                  {formatBs(product.pricePerRoll * (product.rollsPerBox || 1))}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Quantity Chips */}
        <div>
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Atajos de Cantidad
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickChips.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickChip(val)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 border transition ${
                  quantity === val
                    ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 active:bg-zinc-700'
                }`}
              >
                {val} {mode === 'meter' ? 'm' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Stepper & Price Calculation */}
        <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cantidad</div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => adjustQuantity(-1)}
                className="w-8 h-8 rounded-xl bg-zinc-700 text-white font-bold flex items-center justify-center active:bg-zinc-600"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-16 text-center font-black text-base bg-transparent text-white focus:outline-none border-b border-zinc-600 pb-0.5"
              />
              <button
                type="button"
                onClick={() => adjustQuantity(1)}
                className="w-8 h-8 rounded-xl bg-zinc-700 text-white font-bold flex items-center justify-center active:bg-zinc-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Subtotal</div>
            <div className="text-lg font-black text-emerald-400 mt-1">{formatBs(subtotal)}</div>
          </div>
        </div>

        {/* Add to Ticket CTA */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Añadir al Ticket ({formatBs(subtotal)})</span>
        </button>
      </div>
    </div>
  );
}
