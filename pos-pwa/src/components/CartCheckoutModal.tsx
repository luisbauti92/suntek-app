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
  const [receivedCash, setReceivedCash] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetCash = paymentChoice === 'Mixed' ? cashAmount : paymentChoice === 'Cash' ? totalAmount : 0;

  useEffect(() => {
    if (paymentChoice === 'Mixed') {
      const half = Math.round(totalAmount / 2);
      setQrAmount(half);
      setCashAmount(Number((totalAmount - half).toFixed(2)));
    }
  }, [paymentChoice, totalAmount]);

  useEffect(() => {
    if (targetCash > 0) {
      setReceivedCash(targetCash);
    }
  }, [targetCash]);

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

  const splitSum = Number((qrAmount + cashAmount).toFixed(2));
  const splitDiff = Number((totalAmount - splitSum).toFixed(2));
  const isSplitUnbalanced = paymentChoice === 'Mixed' && Math.abs(splitDiff) > 0.01;
  const cashChange = Number(Math.max(0, receivedCash - targetCash).toFixed(2));

  async function handleCheckout() {
    if (cart.length === 0 || isSplitUnbalanced) return;
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] p-5 pb-safe-sheet shadow-2xl text-white max-h-[92vh] flex flex-col space-y-3.5">
        {/* Handle */}
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Ticket de Cobro</h2>
            <span className="text-xs text-zinc-300 font-medium">{cart.length} productos en lista</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 flex items-center justify-center shrink-0 border border-zinc-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Client Name Input */}
        <div>
          <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
            Cliente (Alias o Nombre)
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej. Sonia Velasquez, Rivero, Taller..."
            className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0038a8] focus:border-[#0038a8] transition"
          />
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto max-h-44 space-y-2 pr-1 divide-y divide-zinc-800/80">
          {cart.map((item) => (
            <div key={item.cartId} className="flex items-center justify-between pt-2 text-xs">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-zinc-100 truncate">{item.productName}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {item.unitLabel} • <span className="tabular-nums">{formatBs(item.unitPrice)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-black text-white tabular-nums text-sm">{formatBs(item.subtotal)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.cartId)}
                  className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-rose-400 active:scale-95 flex items-center justify-center transition border border-zinc-700/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
            Método de Cobro
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentChoice('Cash')}
              className={`min-h-[46px] p-2 rounded-xl font-bold text-xs border text-center transition-all active:scale-[0.97] ${
                paymentChoice === 'Cash'
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-600/20'
                  : 'bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-750'
              }`}
            >
              💵 Efectivo
            </button>
            <button
              type="button"
              onClick={() => setPaymentChoice('QrBcp')}
              className={`min-h-[46px] p-2 rounded-xl font-bold text-xs border text-center transition-all active:scale-[0.97] ${
                paymentChoice === 'QrBcp'
                  ? 'bg-[#0038a8]/40 border-blue-400 text-blue-200 shadow-md shadow-[#0038a8]/25'
                  : 'bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-750'
              }`}
            >
              📱 QR BCP
            </button>
            <button
              type="button"
              onClick={() => setPaymentChoice('Mixed')}
              className={`min-h-[46px] p-2 rounded-xl font-bold text-xs border text-center transition-all active:scale-[0.97] ${
                paymentChoice === 'Mixed'
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-md shadow-amber-600/20'
                  : 'bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-750'
              }`}
            >
              ⚖️ Mixto
            </button>
          </div>

          {/* Split Inputs if Mixed */}
          {paymentChoice === 'Mixed' && (
            <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-blue-300 uppercase block mb-1">
                    📱 QR BCP (Bs)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={qrAmount}
                    onChange={(e) => handleQrChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0038a8] font-bold tabular-nums"
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
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold tabular-nums"
                  />
                </div>
              </div>

              {/* Live Balance Status Indicator */}
              <div className="pt-1 flex items-center justify-between text-[11px] font-bold">
                {isSplitUnbalanced ? (
                  splitDiff > 0 ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      ⚠️ Faltan {formatBs(splitDiff)} para cubrir el total
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      ⚠️ El monto supera el total por {formatBs(Math.abs(splitDiff))}
                    </span>
                  )
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    ✓ Monto cuadrado exactamente con el ticket
                  </span>
                )}
                <span className="text-zinc-400 font-mono">
                  Suma: {formatBs(splitSum)}
                </span>
              </div>
            </div>
          )}

          {/* Cash Change Calculator (When Cash or Mixed with Cash is selected) */}
          {targetCash > 0 && (
            <div className="bg-zinc-850/90 border border-zinc-700/80 rounded-2xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                  💵 Efectivo Recibido & Cambio
                </span>
                <span className="text-[10px] text-zinc-400">
                  A cobrar: <strong className="text-white tabular-nums">{formatBs(targetCash)}</strong>
                </span>
              </div>

              {/* Fast Banknote Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setReceivedCash(targetCash)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 border transition-all active:scale-95 ${
                    receivedCash === targetCash
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700/70 text-zinc-300 hover:bg-zinc-750'
                  }`}
                >
                  Exacto
                </button>
                {[20, 50, 100, 200]
                  .filter((b) => b >= targetCash || (targetCash > 100 && b === 200))
                  .map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setReceivedCash(bill)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 border transition-all active:scale-95 ${
                        receivedCash === bill
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-800 border-zinc-700/70 text-zinc-300 hover:bg-zinc-750'
                      }`}
                    >
                      Bs {bill}
                    </button>
                  ))}
              </div>

              {/* Custom Received Amount Input & Change Readout */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-750">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium">Recibe: Bs</span>
                  <input
                    type="number"
                    step="1"
                    value={receivedCash || ''}
                    onChange={(e) => setReceivedCash(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1 text-xs text-white font-black tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                  />
                </div>

                <div className="text-right">
                  {receivedCash >= targetCash ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 shadow-sm">
                      <span className="text-[10px] font-bold uppercase">Cambio:</span>
                      <span className="text-sm font-black tabular-nums">{formatBs(cashChange)}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-400">
                      Faltan {formatBs(targetCash - receivedCash)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grand Total and CTA */}
        <div className="pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Total a Cobrar:</span>
            <span className="text-2xl font-black text-white tabular-nums">{formatBs(totalAmount)}</span>
          </div>

          <button
            type="button"
            disabled={loading || cart.length === 0 || isSplitUnbalanced}
            onClick={handleCheckout}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white min-h-[52px] py-3.5 rounded-2xl font-extrabold text-sm border-t border-white/25 border-x border-b border-emerald-700 shadow-[0_6px_24px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>CONFIRMAR COBRO ({formatBs(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
