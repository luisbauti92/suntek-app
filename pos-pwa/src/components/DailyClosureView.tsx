import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Banknote,
  QrCode,
  Split,
  Calendar,
  Loader2,
  ReceiptText,
} from 'lucide-react';
import type { DailyCashClosureResponse } from '../types';
import { salesApi } from '../api/client';
import { formatBs, formatNumber } from '../utils/formatBs';

type PaymentBadge = { label: string; className: string; Icon: typeof Banknote };

function paymentBadge(method: number): PaymentBadge {
  if (method === 1) {
    return {
      label: 'QR BCP',
      className: 'border-blue-500/40 bg-[#0038a8]/25 text-blue-200',
      Icon: QrCode,
    };
  }
  if (method === 2) {
    return {
      label: 'Mixto',
      className: 'border-amber-700/50 bg-amber-950/50 text-amber-300',
      Icon: Split,
    };
  }
  return {
    label: 'Efectivo',
    className: 'border-emerald-700/50 bg-emerald-950/50 text-emerald-300',
    Icon: Banknote,
  };
}

function formatTime(isoString: string) {
  try {
    return new Date(isoString).toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

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
    } catch {
      setError('No se pudo cargar el arqueo del día.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClosure();
  }, [fetchClosure]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-400" aria-hidden />
          <span className="text-xs font-bold text-zinc-200">
            Arqueo de turno · {data?.date || 'Hoy'}
          </span>
        </div>
        <button
          type="button"
          onClick={fetchClosure}
          disabled={loading}
          aria-label="Actualizar arqueo"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/90 text-zinc-300 transition hover:text-white active:scale-95 disabled:opacity-50 md:h-9 md:w-9"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300"
          >
            {error}
          </div>
        )}

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Total recaudado en mostrador
              </h2>
              <div className="mt-1 text-3xl font-black tabular-nums text-white">
                {formatBs(data?.totalAmountBs || 0)}
              </div>
              <p className="mt-0.5 text-xs font-medium text-zinc-400">
                {data?.salesCount || 0} ventas completadas hoy
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                  <Banknote className="h-4 w-4" aria-hidden /> En cajón
                </dt>
                <dd className="mt-0.5 text-base font-black tabular-nums text-white">
                  {formatBs(data?.totalCashBs || 0)}
                </dd>
                <p className="text-[10px] text-zinc-400">Efectivo físico</p>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-300">
                  <QrCode className="h-4 w-4" aria-hidden /> En banco
                </dt>
                <dd className="mt-0.5 text-base font-black tabular-nums text-white">
                  {formatBs(data?.totalQrBs || 0)}
                </dd>
                <p className="text-[10px] text-zinc-400">QR BCP directo</p>
              </div>
            </dl>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-zinc-300">
            Historial de ventas
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-[#0038a8]" aria-hidden />
              <span className="text-xs font-semibold">Consultando arqueo</span>
            </div>
          ) : !data || data.sales.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/60 p-8 text-center text-xs text-zinc-400">
              <ReceiptText className="mx-auto mb-2 h-8 w-8 text-zinc-600" aria-hidden />
              <p className="font-semibold text-zinc-300">Aún no hay ventas en este turno</p>
              <p className="mt-1">Las ventas que registres aparecerán acá.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-2 md:hidden">
                {data.sales.map((sale) => {
                  const badge = paymentBadge(sale.paymentMethod);
                  const BadgeIcon = badge.Icon;
                  return (
                    <li
                      key={sale.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-white">
                            {sale.clientName || 'Cliente mostrador'}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-zinc-400">
                            {formatTime(sale.createdAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-zinc-300">
                          {sale.productName} ({formatNumber(sale.quantity)}{' '}
                          {sale.saleType === 0 ? 'caj' : 'm/un'})
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            <BadgeIcon className="h-3 w-3" aria-hidden />
                            {badge.label}
                          </span>
                          {sale.ticketCode && (
                            <span className="rounded border border-zinc-700/50 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                              {sale.ticketCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black tabular-nums text-white">
                          {formatBs(sale.totalPrice)}
                        </div>
                        <div className="mt-0.5 text-[11px] tabular-nums text-zinc-400">
                          {formatBs(sale.unitPrice)} / un
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-[10px] uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-bold">
                        Hora
                      </th>
                      <th scope="col" className="px-3 py-2 font-bold">
                        Cliente
                      </th>
                      <th scope="col" className="px-3 py-2 font-bold">
                        Producto
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-bold">
                        Cant.
                      </th>
                      <th scope="col" className="px-3 py-2 font-bold">
                        Pago
                      </th>
                      <th scope="col" className="px-3 py-2 font-bold">
                        Código
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-bold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.sales.map((sale) => {
                      const badge = paymentBadge(sale.paymentMethod);
                      const BadgeIcon = badge.Icon;
                      return (
                        <tr key={sale.id} className="hover:bg-zinc-900/60">
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums text-zinc-400">
                            {formatTime(sale.createdAt)}
                          </td>
                          <td className="max-w-[16ch] truncate px-3 py-2 font-semibold text-zinc-100">
                            {sale.clientName || 'Cliente mostrador'}
                          </td>
                          <td className="max-w-[28ch] truncate px-3 py-2 text-zinc-300">
                            {sale.productName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-zinc-300">
                            {formatNumber(sale.quantity)}{' '}
                            <span className="text-zinc-400">
                              {sale.saleType === 0 ? 'caj' : 'm/un'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                            >
                              <BadgeIcon className="h-3 w-3" aria-hidden />
                              {badge.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-zinc-400">
                            {sale.ticketCode || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-black tabular-nums text-white">
                            {formatBs(sale.totalPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
