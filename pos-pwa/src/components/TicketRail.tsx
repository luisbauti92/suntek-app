import { useMemo } from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import type { BatchSaleResponse, CartItem, ProductDto, SaleMode } from '../types';
import { formatBs } from '../utils/formatBs';
import {
  availableModes,
  modeLabel,
  modeUnitShort,
  resolveSaleLine,
} from '../utils/saleUnits';
import { PaymentPanel } from './PaymentPanel';

interface TicketRailProps {
  cart: CartItem[];
  products: ProductDto[];
  onRemoveLine: (cartId: string) => void;
  onChangeLine: (cartId: string, patch: { mode?: SaleMode; enteredQuantity?: number }) => void;
  onClearCart: () => void;
  onSaleCompleted: (response: BatchSaleResponse) => void;
}

export function TicketRail({
  cart,
  products,
  onRemoveLine,
  onChangeLine,
  onClearCart,
  onSaleCompleted,
}: TicketRailProps) {
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );
  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <aside className="hidden h-full min-h-0 flex-col border-l border-zinc-800 bg-zinc-900/40 md:flex">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Ticket</h2>
        <span className="text-[11px] text-zinc-400">
          {cart.length} {cart.length === 1 ? 'línea' : 'líneas'}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
            <ShoppingBag className="h-7 w-7 text-zinc-600" aria-hidden />
            <p className="text-sm font-semibold text-zinc-300">El ticket está vacío</p>
            <p className="text-xs text-zinc-400">
              Elegí un producto del catálogo para agregarlo con su unidad por defecto.
            </p>
          </div>
        ) : (
          <ul>
            {cart.map((item) => (
              <TicketLine
                key={item.cartId}
                item={item}
                product={productById.get(item.productId)}
                onRemove={onRemoveLine}
                onChange={onChangeLine}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-3">
        <PaymentPanel
          cart={cart}
          totalAmount={total}
          ctaLabel="Registrar venta"
          onCompleted={onSaleCompleted}
          onClearCart={onClearCart}
        />
      </div>
    </aside>
  );
}

function TicketLine({
  item,
  product,
  onRemove,
  onChange,
}: {
  item: CartItem;
  product: ProductDto | undefined;
  onRemove: (cartId: string) => void;
  onChange: (cartId: string, patch: { mode?: SaleMode; enteredQuantity?: number }) => void;
}) {
  const modes = product ? availableModes(product) : [item.mode];
  const unitShort = modeUnitShort(item.mode);

  function stepBy(delta: number) {
    const step = item.mode === 'meter' && item.enteredQuantity <= 1 ? 0.5 : 1;
    const next = Math.max(step, item.enteredQuantity + delta * step);
    onChange(item.cartId, { enteredQuantity: Number(next.toFixed(2)) });
  }

  return (
    <li className="space-y-1.5 border-b border-zinc-800/80 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">{item.productName}</p>
          <p className="truncate font-mono text-[10px] text-zinc-400">{item.productSku}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.cartId)}
          aria-label={`Quitar ${item.productName} del ticket`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:text-rose-400 active:scale-95 pointer-coarse:h-11 pointer-coarse:w-11"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {modes.length > 1 && (
        <div role="group" aria-label="Unidad de venta" className="flex gap-1.5">
          {modes.map((m) => {
            const active = item.mode === m;
            const price = product ? resolveSaleLine(product, m, 1).unitPrice : 0;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(item.cartId, { mode: m, enteredQuantity: 1 })}
                className={`flex min-h-8 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-1.5 text-[11px] font-bold tabular-nums transition active:scale-[0.97] pointer-coarse:min-h-11 ${
                  active
                    ? 'border-blue-400/40 bg-[#0038a8] text-white'
                    : 'border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>{modeLabel(m)}</span>
                <span className="text-[10px] font-medium opacity-75">{formatBs(price)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepBy(-1)}
            aria-label={`Restar cantidad a ${item.productName}`}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-white transition hover:bg-zinc-700 active:scale-90 pointer-coarse:h-11 pointer-coarse:w-11"
          >
            <Minus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
          </button>
          <input
            type="number"
            step="0.5"
            min="0.5"
            inputMode="decimal"
            aria-label={`Cantidad de ${item.productName}`}
            value={item.enteredQuantity}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v) && v > 0) {
                onChange(item.cartId, { enteredQuantity: v });
              }
            }}
            className="min-h-8 w-12 rounded-md border border-zinc-700/60 bg-zinc-950 text-center text-[13px] font-black tabular-nums text-white focus:border-[#0038a8] focus:outline-none focus:ring-1 focus:ring-[#0038a8] pointer-coarse:min-h-11"
          />
          <button
            type="button"
            onClick={() => stepBy(1)}
            aria-label={`Sumar cantidad a ${item.productName}`}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-white transition hover:bg-zinc-700 active:scale-90 pointer-coarse:h-11 pointer-coarse:w-11"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
          </button>
          <span className="ml-0.5 text-[11px] text-zinc-400">{unitShort}</span>
        </div>

        <div className="text-right">
          <div className="text-[10px] tabular-nums text-zinc-400">
            {formatBs(item.unitPrice)} / {unitShort}
          </div>
          <div className="text-[13px] font-black tabular-nums text-white">
            {formatBs(item.subtotal)}
          </div>
        </div>
      </div>
    </li>
  );
}
