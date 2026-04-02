import { Fragment, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  Layers,
  Loader2,
  Package,
  PackageOpen,
  ShoppingCart,
  Wrench,
} from 'lucide-react';
import { MovementFilterBar, type MovementFilterValue } from './MovementFilterBar';
import type { InventoryItemDto, MovementDto } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';

function formatBs(n: number): string {
  return `Bs ${n.toFixed(2)}`;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function localDateKey(createdAt: string): string {
  const d = new Date(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatGroupTitle(
  dateKey: string,
  intlLocale: string,
  todayPrefix: string,
  yesterdayPrefix: string
): string {
  const dateFmt = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const [y, mo, da] = dateKey.split('-').map(Number);
  const date = new Date(y, mo - 1, da);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const short = dateFmt.format(date);
  if (isSameLocalDay(date, today)) return `${todayPrefix}${short}`;
  if (isSameLocalDay(date, yesterday)) return `${yesterdayPrefix}${short}`;
  return short;
}

function groupMovementsByLocalDate(movements: MovementDto[]): [string, MovementDto[]][] {
  const map = new Map<string, MovementDto[]>();
  for (const m of movements) {
    const key = localDateKey(m.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  const entries = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  for (const [, rows] of entries) {
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return entries;
}

type MovementTypeNorm = 'Sale' | 'Register' | 'OpenBox' | 'Adjustment' | 'Other';

function normalizeMovementType(t: string): MovementTypeNorm {
  const u = t.toLowerCase();
  if (u === 'sale' || u === '2') return 'Sale';
  if (u === 'register' || u === '0') return 'Register';
  if (u === 'openbox' || u === 'open box' || u === '1') return 'OpenBox';
  if (u === 'adjustment' || u === '3') return 'Adjustment';
  return 'Other';
}

function MovementTypeBadge({ type }: { type: string }) {
  const { t } = useLanguage();
  const n = normalizeMovementType(type);
  if (n === 'Sale') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
        <ShoppingCart className="h-3 w-3 shrink-0" aria-hidden />
        {t('movements.badgeSale')}
      </span>
    );
  }
  if (n === 'Register') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200">
        <Package className="h-3 w-3 shrink-0" aria-hidden />
        {t('movements.badgeRegister')}
      </span>
    );
  }
  if (n === 'OpenBox') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
        <PackageOpen className="h-3 w-3 shrink-0" aria-hidden />
        {t('movements.badgeOpenBox')}
      </span>
    );
  }
  if (n === 'Adjustment') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
        <Wrench className="h-3 w-3 shrink-0" aria-hidden />
        {t('movements.badgeAdjust')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
      {type}
    </span>
  );
}

interface MovementHistoryPanelProps {
  movements: MovementDto[];
  movementsLoading: boolean;
  movementsTotalCount: number;
  movementsTotalSalesBs: number;
  movementsPage: number;
  movementsPageSize: number;
  onMovementsPageChange: (page: number) => void;
  onMovementsPageSizeChange: (pageSize: number) => void;
  inventoryItems: InventoryItemDto[];
  movementFilter: MovementFilterValue;
  onFilterChange: (val: MovementFilterValue) => void;
  exportExcelLoading: boolean;
  onExportExcel: () => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function MovementHistoryPanel({
  movements,
  movementsLoading,
  movementsTotalCount,
  movementsTotalSalesBs,
  movementsPage,
  movementsPageSize,
  onMovementsPageChange,
  onMovementsPageSizeChange,
  inventoryItems,
  movementFilter,
  onFilterChange,
  exportExcelLoading,
  onExportExcel,
}: MovementHistoryPanelProps) {
  const { locale, t } = useLanguage();
  const intlLocale = locale === 'es' ? 'es-BO' : 'en-US';
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [intlLocale]
  );

  const totalSalesBs = movementsTotalSalesBs;
  const movementCount = movementsTotalCount;
  const totalPages =
    movementsTotalCount === 0
      ? 1
      : Math.ceil(movementsTotalCount / movementsPageSize);
  const lowStockCount = useMemo(
    () => inventoryItems.filter((i) => i.wholesaleQuantity < 5).length,
    [inventoryItems]
  );

  const grouped = useMemo(() => groupMovementsByLocalDate(movements), [movements]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('movements.kpiSales')}
            </p>
            <TrendingUp className="h-5 w-5 text-emerald-500" aria-hidden />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-emerald-600 tabular-nums">
            {formatBs(Number(totalSalesBs))}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('movements.kpiSalesHint')}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('movements.kpiCount')}
            </p>
            <Layers className="h-5 w-5 text-indigo-500" aria-hidden />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {movementCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('movements.kpiCountHint')}</p>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
              {t('movements.kpiLowStock')}
            </p>
            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-amber-900 tabular-nums">
            {lowStockCount}
          </p>
          <p className="mt-1 text-xs text-amber-900/70">{t('movements.kpiLowStockHint')}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <MovementFilterBar embedded value={movementFilter} onChange={onFilterChange} />
          <button
            type="button"
            onClick={onExportExcel}
            disabled={exportExcelLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportExcelLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            {exportExcelLoading ? t('movements.exportGenerating') : t('movements.exportExcel')}
          </button>
        </div>

        {movementsLoading ? (
          <div className="animate-pulse space-y-3 p-8">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded bg-slate-100" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-900">{t('movements.emptyTitle')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('movements.emptyHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">{t('movements.colTime')}</th>
                  <th className="px-5 py-3.5">{t('movements.colType')}</th>
                  <th className="px-5 py-3.5">{t('movements.colProduct')}</th>
                  <th className="px-5 py-3.5">{t('movements.colDetail')}</th>
                  <th className="px-5 py-3.5">{t('movements.colAmount')}</th>
                  <th className="px-5 py-3.5">{t('movements.colStockAfter')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grouped.map(([dateKey, rows]) => (
                  <Fragment key={dateKey}>
                    <tr className="bg-slate-50">
                      <td
                        colSpan={6}
                        className="px-5 py-2.5 text-xs font-semibold text-slate-700"
                      >
                        {formatGroupTitle(
                          dateKey,
                          intlLocale,
                          t('movements.todayPrefix'),
                          t('movements.yesterdayPrefix')
                        )}
                      </td>
                    </tr>
                    {rows.map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                          {timeFmt.format(new Date(m.createdAt))}
                        </td>
                        <td className="px-5 py-3.5">
                          <MovementTypeBadge type={m.movementType} />
                        </td>
                        <td className="max-w-[220px] px-5 py-3.5">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {m.productName}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">{m.productSku}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{m.description}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm tabular-nums text-slate-700">
                          {normalizeMovementType(m.movementType) === 'Sale' &&
                          m.saleUnitPriceBs != null &&
                          m.saleTotalBs != null ? (
                            <div className="flex flex-col gap-0.5 text-xs leading-tight sm:text-sm">
                              <span className="text-slate-500">
                                {t('movements.unitPricePrefix')}{' '}
                                {formatBs(Number(m.saleUnitPriceBs))}
                              </span>
                              <span className="font-medium text-slate-900">
                                {formatBs(Number(m.saleTotalBs))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          {m.wholesaleQuantityAfter != null && (
                            <span className="mr-2">
                              {m.wholesaleQuantityAfter} {t('movements.boxesSuffix')}
                            </span>
                          )}
                          {m.retailQuantityAfter != null && (
                            <span>
                              {Number(m.retailQuantityAfter).toFixed(2)}{' '}
                              {t('movements.retailSuffix')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!movementsLoading && movementsTotalCount > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{t('movements.perPage')}</span>
              <select
                value={movementsPageSize}
                onChange={(e) => onMovementsPageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onMovementsPageChange(movementsPage - 1)}
                disabled={movementsPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {t('movements.paginationPrev')}
              </button>
              <span className="min-w-[8rem] text-center text-sm tabular-nums text-slate-600">
                {t('movements.pageOf', { current: movementsPage, total: totalPages })}
              </span>
              <button
                type="button"
                onClick={() => onMovementsPageChange(movementsPage + 1)}
                disabled={movementsPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('movements.paginationNext')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
