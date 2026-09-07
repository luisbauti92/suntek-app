import { useState, useEffect } from 'react';
import { X, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import type { CartItem, RecordBatchSalePayload, BatchSaleResponse } from '../types';
import { salesApi } from '../api/client';
import { formatBs } from '../utils/formatBs';

interface CartCheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onSaleCompleted: (response: BatchSaleResponse) => void;
}

type PaymentChoice = 'Cash' | 'QrBcp' | 'Mixed';

export function CartCheckoutModal({
  cart,
  onClose,
  onRemoveItem,
  onClearCart,
  onSaleCompleted,
}: CartCheckoutModalProps) {
  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const [clientName, setClientName] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('QrBcp');
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentChoice === 'Mixed') {
      const half = Math.round(totalAmount / 2);
      setQrAmount(half);
      setCashAmount(Number((totalAmount - half).toFixed(2)));
    }
  }, [paymentChoice, totalAmount]);

  function handleQrChange(val: number) {
    setQrAmount(val);
    const remainder = Math.max(0, totalAmount - val);
    setCashAmount(Number(remainder.toFixed(2)));
  }

  function handleCashChange(val: number) {
    setCashAmount(val);
    const remainder = Math.max(0, totalAmount - val);
    setQrAmount(Number(remainder.toFixed(2)));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setError(null);
    setLoading(true);

    let paymentMethodNum = 0; // Cash
    if (paymentChoice === 'QrBcp') paymentMethodNum = 1;
    if (paymentChoice === 'Mixed') paymentMethodNum = 2;

    const payload: RecordBatchSalePayload = {
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        saleType: i.saleType === 'Wholesale' ? 0 : 1,
        unitPrice: i.unitPrice,
      })),
      clientName: clientName.trim() || undefined,
      paymentMethod: paymentMethodNum,
      cashAmount: paymentChoice === 'Mixed' ? cashAmount : paymentChoice === 'Cash' ? totalAmount : 0,
      qrAmount: paymentChoice === 'Mixed' ? qrAmount : paymentChoice === 'QrBcp' ? totalAmount : 0,
    };

    try {
      const res = await salesApi.recordBatch(payload);
      if (res.success) {
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            /* ignore */
          }
        }
        onSaleCompleted(res);
        onClearCart();
        onClose();
      } else {
        setError(res.errorMessage || 'No se pudo procesar la venta.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.errorMessage ||
        err.response?.data?.message ||
        'Error de conexión al registrar la venta.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] p-5 pb-safe-sheet shadow-2xl text-white max-h-[92vh] flex flex-col space-y-4">
        {/* Handle */}
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div>
            <h2 className="text-base font-bold text-white">Ticket de Venta</h2>
            <span className="text-xs text-zinc-400 font-medium">{cart.length} productos en ticket</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Client Name Input */}
        <div>
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Cliente (Alias o Nombre)
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej. Sonia Velasquez, Rivero, Taller..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto max-h-44 space-y-2 pr-1 divide-y divide-zinc-800/80">
          {cart.map((item) => (
            <div key={item.cartId} className="flex items-center justify-between pt-2 text-xs">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-zinc-200 truncate">{item.productName}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {item.unitLabel} • {formatBs(item.unitPrice)}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-white tabular-nums">{formatBs(item.subtotal)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.cartId)}
                  className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 pt-1 border-t border-zinc-800">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Método de Cobro
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentChoice('Cash')}
              className={`p-2.5 rounded-xl font-bold text-xs border text-center transition ${
                paymentChoice === 'Cash'
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-600/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
              }`}
            >
              💵 Efectivo
            </button>
            <button
              type="button"
              onClick={() => setPaymentChoice('QrBcp')}
              className={`p-2.5 rounded-xl font-bold text-xs border text-center transition ${
                paymentChoice === 'QrBcp'
                  ? 'bg-violet-600/30 border-violet-500 text-violet-300 shadow-md shadow-violet-600/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
              }`}
            >
              📱 QR BCP
            </button>
            <button
              type="button"
              onClick={() => setPaymentChoice('Mixed')}
              className={`p-2.5 rounded-xl font-bold text-xs border text-center transition ${
                paymentChoice === 'Mixed'
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-md shadow-amber-600/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
              }`}
            >
              ⚖️ Mixto
            </button>
          </div>

          {/* Split Inputs if Mixed */}
          {paymentChoice === 'Mixed' && (
            <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-2xl p-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-violet-400 uppercase block mb-1">
                  📱 QR BCP (Bs)
                </label>
                <input
                  type="number"
                  step="1"
                  value={qrAmount}
                  onChange={(e) => handleQrChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                  💵 Efectivo (Bs)
                </label>
                <input
                  type="number"
                  step="1"
                  value={cashAmount}
                  onChange={(e) => handleCashChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Grand Total and CTA */}
        <div className="pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total a Cobrar:</span>
            <span className="text-xl font-black text-white">{formatBs(totalAmount)}</span>
          </div>

          <button
            type="button"
            disabled={loading || cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>CONFIRMAR VENTA ({formatBs(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
