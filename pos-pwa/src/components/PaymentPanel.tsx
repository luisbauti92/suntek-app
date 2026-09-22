import { useState, useEffect } from 'react';
import { Check, Loader2, AlertCircle, Banknote, QrCode, Split } from 'lucide-react';
import type { CartItem, RecordBatchSalePayload, BatchSaleResponse } from '../types';
import { salesApi } from '../api/client';
import { formatBs } from '../utils/formatBs';
import { soldUnitToken } from '../utils/saleUnits';
import { haptics } from '../utils/haptics';

interface PaymentPanelProps {
  cart: CartItem[];
  totalAmount: number;
  /** Wording of the primary action: the rail commits a sale, the sheet confirms a charge. */
  ctaLabel?: string;
  onCompleted: (response: BatchSaleResponse) => void;
  onClearCart: () => void;
}

type PaymentChoice = 'Cash' | 'QrBcp' | 'Mixed';

const PAYMENT_OPTIONS: { choice: PaymentChoice; label: string; Icon: typeof Banknote }[] = [
  { choice: 'Cash', label: 'Efectivo', Icon: Banknote },
  { choice: 'QrBcp', label: 'QR BCP', Icon: QrCode },
  { choice: 'Mixed', label: 'Mixto', Icon: Split },
];

const ACTIVE_STYLE: Record<PaymentChoice, string> = {
  Cash: 'bg-emerald-600/25 border-emerald-500 text-emerald-200',
  QrBcp: 'bg-[#0038a8]/40 border-blue-400 text-blue-100',
  Mixed: 'bg-amber-600/25 border-amber-500 text-amber-200',
};

export function PaymentPanel({
  cart,
  totalAmount,
  ctaLabel = 'Confirmar cobro',
  onCompleted,
  onClearCart,
}: PaymentPanelProps) {
  const [clientName, setClientName] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('QrBcp');
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [receivedCash, setReceivedCash] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetCash =
    paymentChoice === 'Mixed' ? cashAmount : paymentChoice === 'Cash' ? totalAmount : 0;

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
        unit: soldUnitToken(i.mode),
        enteredQuantity: i.enteredQuantity,
      })),
      clientName: clientName.trim() || undefined,
      paymentMethod: paymentMethodNum,
      cashAmount:
        paymentChoice === 'Mixed' ? cashAmount : paymentChoice === 'Cash' ? totalAmount : 0,
      qrAmount:
        paymentChoice === 'Mixed' ? qrAmount : paymentChoice === 'QrBcp' ? totalAmount : 0,
    };

    try {
      const res = await salesApi.recordBatch(payload);
      if (res.success) {
        haptics.success();
        onCompleted(res);
        onClearCart();
      } else {
        setError(res.errorMessage || 'No se pudo procesar la venta.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errorMessage?: string; message?: string } } };
      setError(
        e.response?.data?.errorMessage ||
          e.response?.data?.message ||
          'Error de conexión al registrar la venta.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3.5">
      {error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-2 text-rose-300 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="pos-client-name"
          className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5"
        >
          Cliente (alias o nombre)
        </label>
        <input
          id="pos-client-name"
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Ej. Sonia Velasquez, Rivero, Taller"
          className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0038a8] focus:border-[#0038a8] transition"
        />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
          Método de cobro
        </span>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTIONS.map(({ choice, label, Icon }) => {
            const active = paymentChoice === choice;
            return (
              <button
                key={choice}
                type="button"
                aria-pressed={active}
                onClick={() => setPaymentChoice(choice)}
                className={`min-h-[46px] p-2 rounded-xl font-bold text-xs border text-center transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                  active
                    ? ACTIVE_STYLE[choice]
                    : 'bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        {paymentChoice === 'Mixed' && (
          <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="pos-qr-amount"
                  className="text-[10px] font-bold text-blue-300 uppercase block mb-1"
                >
                  QR BCP (Bs)
                </label>
                <input
                  id="pos-qr-amount"
                  type="number"
                  step="1"
                  inputMode="decimal"
                  value={qrAmount}
                  onChange={(e) => handleQrChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-base sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0038a8] font-bold tabular-nums"
                />
              </div>
              <div>
                <label
                  htmlFor="pos-cash-amount"
                  className="text-[10px] font-bold text-emerald-400 uppercase block mb-1"
                >
                  Efectivo (Bs)
                </label>
                <input
                  id="pos-cash-amount"
                  type="number"
                  step="1"
                  inputMode="decimal"
                  value={cashAmount}
                  onChange={(e) => handleCashChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-base sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold tabular-nums"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] font-bold">
              {isSplitUnbalanced ? (
                splitDiff > 0 ? (
                  <span className="text-amber-400">
                    Faltan {formatBs(splitDiff)} para cubrir el total
                  </span>
                ) : (
                  <span className="text-rose-400">
                    El monto supera el total por {formatBs(Math.abs(splitDiff))}
                  </span>
                )
              ) : (
                <span className="text-emerald-400">Monto cuadrado con el ticket</span>
              )}
              <span className="text-zinc-400 font-mono">Suma: {formatBs(splitSum)}</span>
            </div>
          </div>
        )}

        {targetCash > 0 && (
          <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                Efectivo recibido y cambio
              </span>
              <span className="text-[10px] text-zinc-400">
                A cobrar:{' '}
                <strong className="text-white tabular-nums">{formatBs(targetCash)}</strong>
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setReceivedCash(targetCash)}
                aria-pressed={receivedCash === targetCash}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border px-3 text-xs font-bold transition-all active:scale-95 md:min-h-9 ${
                  receivedCash === targetCash
                    ? 'bg-emerald-600/25 border-emerald-500 text-emerald-200'
                    : 'bg-zinc-800 border-zinc-700/70 text-zinc-300 hover:bg-zinc-700'
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
                    aria-pressed={receivedCash === bill}
                    className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border px-3 text-xs font-bold transition-all active:scale-95 md:min-h-9 ${
                      receivedCash === bill
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-200'
                        : 'bg-zinc-800 border-zinc-700/70 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    Bs {bill}
                  </button>
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-700">
              <div className="flex items-center gap-1.5">
                <label htmlFor="pos-received-cash" className="text-[10px] text-zinc-400 font-medium">
                  Recibe: Bs
                </label>
                <input
                  id="pos-received-cash"
                  type="number"
                  step="1"
                  inputMode="decimal"
                  value={receivedCash || ''}
                  onChange={(e) => setReceivedCash(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1 text-base sm:text-xs text-white font-black tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                />
              </div>

              <div className="text-right">
                {receivedCash >= targetCash ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
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

      <div className="pt-3 border-t border-zinc-800">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Total a cobrar
          </span>
          <span className="text-2xl font-black text-white tabular-nums">
            {formatBs(totalAmount)}
          </span>
        </div>

        <button
          type="button"
          disabled={loading || cart.length === 0 || isSplitUnbalanced}
          onClick={handleCheckout}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white min-h-[52px] py-3.5 rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          ) : (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" aria-hidden />
              <span>
                {ctaLabel} ({formatBs(totalAmount)})
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
