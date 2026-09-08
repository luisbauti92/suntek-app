import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Banknote, QrCode, Calendar, Loader2, ReceiptText } from 'lucide-react';
import type { DailyCashClosureResponse } from '../types';
import { salesApi } from '../api/client';
import { formatBs, formatNumber } from '../utils/formatBs';

export function DailyClosureView() {
  const [data, setData] = useState<DailyCashClosureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClosure = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salesApi.getDailyClosure();
      setData(res);
    } catch (err: any) {
      setError('No se pudo cargar el arqueo del día.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClosure();
  }, [fetchClosure]);

  function formatTime(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Top Banner & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-zinc-200">
            Arqueo de Turno • {data?.date || 'Hoy'}
          </span>
        </div>
        <button
          type="button"
          onClick={fetchClosure}
          disabled={loading}
          className="p-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700/60 text-zinc-300 hover:text-white transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Main KPI Card (Thermal Receipt Style) */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-3xl p-5 shadow-2xl space-y-4 relative">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Recaudado en Mostrador
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700/50">
              AUDIT ✓
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-1 tabular-nums">
            {formatBs(data?.totalAmountBs || 0)}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block font-medium">
            {data?.salesCount || 0} ventas completadas hoy
          </span>
        </div>

        {/* Dashed line separator like a receipt */}
        <div className="border-t border-dashed border-zinc-700/80 -mx-1"></div>

        {/* Breakdown Cash (Cajón) vs QR (Banco) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-zinc-850/90 p-3.5 rounded-2xl border border-zinc-700/70 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
              <Banknote className="w-4 h-4" />
              <span>💵 En Cajón</span>
            </div>
            <div className="text-base font-black text-white mt-1.5 tabular-nums">
              {formatBs(data?.totalCashBs || 0)}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">Efectivo físico</span>
          </div>

          <div className="bg-blue-950/40 p-3.5 rounded-2xl border border-blue-800/50 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-300 uppercase tracking-wide">
              <QrCode className="w-4 h-4" />
              <span>📱 En Banco</span>
            </div>
            <div className="text-base font-black text-white mt-1.5 tabular-nums">
              {formatBs(data?.totalQrBs || 0)}
            </div>
            <span className="text-[10px] text-blue-300/70 mt-0.5 block">QR BCP directo</span>
          </div>
        </div>
      </div>

      {/* Itemized list of sales */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider px-1">
          Historial de Ventas
        </h3>

        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0038a8]" />
            <span className="text-xs font-semibold">Consultando arqueo...</span>
          </div>
        ) : !data || data.sales.length === 0 ? (
          <div className="bg-zinc-900/60 border border-dashed border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 text-xs">
            <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-50 text-zinc-400" />
            <span>Aún no hay ventas registradas en este turno.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {data.sales.map((sale) => (
              <div
                key={sale.id}
                className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-3.5 flex items-center justify-between text-xs hover:border-zinc-700 transition"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">
                      {sale.clientName || 'Cliente Mostrador'}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                      {formatTime(sale.createdAt)}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-300 mt-0.5 truncate">
                    {sale.productName} ({formatNumber(sale.quantity)}{' '}
                    {sale.saleType === 0 ? 'caj' : 'm/un'})
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        sale.paymentMethod === 1
                          ? 'bg-[#0038a8]/30 text-blue-200 border border-blue-500/40'
                          : sale.paymentMethod === 2
                          ? 'bg-amber-950/50 text-amber-300 border border-amber-700/50'
                          : 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {sale.paymentMethod === 1
                        ? '📱 QR BCP'
                        : sale.paymentMethod === 2
                        ? '⚖️ Mixto'
                        : '💵 Efectivo'}
                    </span>
                    {sale.ticketCode && (
                      <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50">
                        {sale.ticketCode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-sm text-white tabular-nums">
                    {formatBs(sale.totalPrice)}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 tabular-nums">
                    {formatBs(sale.unitPrice)} / un
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
