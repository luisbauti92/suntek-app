import { X, Trash2 } from 'lucide-react';
import type { CartItem, BatchSaleResponse } from '../types';
import { formatBs } from '../utils/formatBs';
import { PaymentPanel } from './PaymentPanel';

interface CartCheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onSaleCompleted: (response: BatchSaleResponse) => void;
}

export function CartCheckoutModal({
  cart,
  onClose,
  onRemoveItem,
  onClearCart,
  onSaleCompleted,
}: CartCheckoutModalProps) {
  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] p-5 pb-safe-sheet shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2"></div>

        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mt-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Ticket de cobro</h2>
            <span className="text-xs text-zinc-300 font-medium">
              {cart.length} {cart.length === 1 ? 'producto' : 'productos'} en lista
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ticket de cobro"
            className="w-11 h-11 rounded-full bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 flex items-center justify-center shrink-0 border border-zinc-700/50"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        <ul className="my-3 max-h-44 overflow-y-auto space-y-2 divide-y divide-zinc-800/80">
          {cart.map((item) => (
            <li key={item.cartId} className="flex items-center justify-between pt-2 text-xs">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-zinc-100 truncate">{item.productName}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {item.unitLabel} •{' '}
                  <span className="tabular-nums">{formatBs(item.unitPrice)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-black text-white tabular-nums text-sm">
                  {formatBs(item.subtotal)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.cartId)}
                  aria-label={`Quitar ${item.productName} del ticket`}
                  className="w-11 h-11 rounded-xl bg-zinc-800 text-zinc-400 hover:text-rose-400 active:scale-95 flex items-center justify-center transition border border-zinc-700/40"
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <PaymentPanel
          cart={cart}
          totalAmount={totalAmount}
          ctaLabel="Confirmar cobro"
          onCompleted={(res) => {
            onSaleCompleted(res);
            onClose();
          }}
          onClearCart={onClearCart}
        />
      </div>
    </div>
  );
}
