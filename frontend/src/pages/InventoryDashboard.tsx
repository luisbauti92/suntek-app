import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { inventoryApi, salesApi } from '../api/client';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ProductForm } from '../components/ProductForm';
import { EditProductModal } from '../components/EditProductModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { SalesEntryModal } from '../components/SalesEntryModal';
import { AddStockModal } from '../components/AddStockModal';
import { MovementHistoryPanel } from '../components/MovementHistoryPanel';
import type { MovementFilterValue } from '../components/MovementFilterBar';
import type { InventoryItemDto, MovementDto } from '../api/client';

function formatRetailQuantity(
  item: InventoryItemDto,
  unitMt: string,
  unitUnits: string
): string {
  const isMeters = item.unitType === 'Meters' || item.unitType === 0;
  if (isMeters) {
    return `${Number(item.retailQuantity).toFixed(2)} ${unitMt}`;
  }
  return `${Math.round(item.retailQuantity)} ${unitUnits}`;
}

const INVENTORY_PAGE_SIZES = [10, 25, 50] as const;

function filterInventoryItems(items: InventoryItemDto[], searchRaw: string): InventoryItemDto[] {
  const q = searchRaw.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) => i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
  );
}

function useClientInventoryPaging(items: InventoryItemDto[], searchRaw: string, page: number, pageSize: number) {
  const filtered = useMemo(
    () => filterInventoryItems(items, searchRaw),
    [items, searchRaw]
  );

  const totalFiltered = filtered.length;
  const totalPages = totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = useMemo(
    () => filtered.slice(start, start + pageSize),
    [filtered, start, pageSize]
  );

  return { filtered, paged, totalFiltered, totalPages, safePage };
}

function InventoryListChrome({
  searchValue,
  onSearchChange,
  page,
  pageSize,
  totalPages,
  totalFiltered,
  onPageChange,
  onPageSizeChange,
  children,
}: {
  searchValue: string;
  onSearchChange: (v: string) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  totalFiltered: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('dashboard.inventorySearchPlaceholder')}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoComplete="off"
          />
        </div>
      </div>
      {children}
      {totalFiltered > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{t('movements.perPage')}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {INVENTORY_PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {t('movements.paginationPrev')}
            </button>
            <span className="min-w-[8rem] text-center text-sm tabular-nums text-slate-600">
              {t('movements.pageOf', { current: page, total: totalPages })}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('movements.paginationNext')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function InventoryDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'warehouse' | 'storefront' | 'movements'>('warehouse');
  const [openBoxProductId, setOpenBoxProductId] = useState<number | null>(null);
  const [openBoxLoading, setOpenBoxLoading] = useState(false);
  const [addStockItem, setAddStockItem] = useState<InventoryItemDto | null>(null);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [movements, setMovements] = useState<MovementDto[]>([]);
  const [movementsTotalCount, setMovementsTotalCount] = useState(0);
  const [movementsTotalSalesBs, setMovementsTotalSalesBs] = useState(0);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPageSize, setMovementsPageSize] = useState(25);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementFilter, setMovementFilter] = useState<MovementFilterValue>({
    option: 'last30',
    startDate: undefined,
    endDate: undefined,
  });
  const [exportExcelLoading, setExportExcelLoading] = useState(false);
  const [editProductItem, setEditProductItem] = useState<InventoryItemDto | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize, setInventoryPageSize] = useState(25);

  const { paged: inventoryPaged, totalFiltered, totalPages, safePage } =
    useClientInventoryPaging(items, inventorySearch, inventoryPage, inventoryPageSize);

  useEffect(() => {
    if (safePage !== inventoryPage) setInventoryPage(safePage);
  }, [safePage, inventoryPage]);

  const handleInventorySearchChange = useCallback((v: string) => {
    setInventorySearch(v);
    setInventoryPage(1);
  }, []);

  const handleInventoryPageSizeChange = useCallback((n: number) => {
    setInventoryPageSize(n);
    setInventoryPage(1);
  }, []);

  const refreshItems = useCallback(() => {
    setLoading(true);
    inventoryApi
      .list()
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const refreshMovements = useCallback(() => {
    setMovementsLoading(true);
    salesApi
      .listMovements(
        movementFilter.startDate,
        movementFilter.endDate,
        movementsPage,
        movementsPageSize
      )
      .then((res) => {
        const d = res.data;
        setMovements(d.items);
        setMovementsTotalCount(d.totalCount);
        setMovementsTotalSalesBs(d.totalSalesBsInRange);
        if (d.page !== movementsPage) setMovementsPage(d.page);
      })
      .catch(() => {
        setMovements([]);
        setMovementsTotalCount(0);
        setMovementsTotalSalesBs(0);
      })
      .finally(() => setMovementsLoading(false));
  }, [movementFilter, movementsPage, movementsPageSize]);

  useEffect(() => {
    if (activeTab === 'movements') refreshMovements();
  }, [activeTab, movementFilter, movementsPage, movementsPageSize, refreshMovements]);

  function handleOpenBoxClick(productId: number) {
    setOpenBoxProductId(productId);
  }

  async function handleExportExcel() {
    setExportExcelLoading(true);
    try {
      await salesApi.exportSalesReport(movementFilter.startDate, movementFilter.endDate);
      toast.success(t('dashboard.toastExportSuccess'));
    } catch {
      toast.error(t('dashboard.toastExportError'));
    } finally {
      setExportExcelLoading(false);
    }
  }

  async function handleOpenBoxConfirm() {
    if (openBoxProductId == null) return;
    setOpenBoxLoading(true);
    try {
      await inventoryApi.openBox(openBoxProductId);
      refreshItems();
      refreshMovements();
      setOpenBoxProductId(null);
      toast.success(t('dashboard.toastOpenBoxSuccess'));
    } catch {
      // Error - list will not refresh
    } finally {
      setOpenBoxLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">{t('dashboard.title')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />
            <span className="text-sm text-slate-600">{user?.email}</span>
            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
              {user?.roles.join(', ')}
            </span>
            <button
              onClick={logout}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('dashboard.signOut')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('warehouse')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'warehouse'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('dashboard.tabWarehouse')}
            </button>
            <button
              onClick={() => setActiveTab('storefront')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'storefront'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('dashboard.tabStorefront')}
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'movements'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('dashboard.tabMovements')}
            </button>
          </div>
          <div className="flex gap-2">
          <button
            onClick={() => setSalesModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('dashboard.recordSale')}
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('dashboard.addProduct')}
          </button>
          </div>
        </div>

        <ProductForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={refreshItems}
        />

        <SalesEntryModal
          isOpen={salesModalOpen}
          onClose={() => setSalesModalOpen(false)}
          onSuccess={() => { refreshItems(); if (activeTab === 'movements') refreshMovements(); }}
          products={items}
        />

        <ConfirmModal
          isOpen={openBoxProductId != null}
          onClose={() => setOpenBoxProductId(null)}
          onConfirm={handleOpenBoxConfirm}
          title={t('dashboard.openBoxTitle')}
          message={t('dashboard.openBoxMessage')}
          confirmLabel={t('dashboard.openBox')}
          isLoading={openBoxLoading}
        />

        <AddStockModal
          isOpen={addStockItem != null}
          onClose={() => setAddStockItem(null)}
          onSuccess={() => { refreshItems(); if (activeTab === 'movements') refreshMovements(); }}
          item={addStockItem}
        />

        <EditProductModal
          item={editProductItem}
          isOpen={editProductItem != null}
          onClose={() => setEditProductItem(null)}
          onSuccess={() => {
            refreshItems();
            if (activeTab === 'movements') refreshMovements();
          }}
        />

        {loading && activeTab !== 'movements' ? (
          <div className="animate-pulse bg-white rounded-lg border border-slate-200 p-8">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        ) : activeTab === 'movements' ? (
          <MovementHistoryPanel
            movements={movements}
            movementsLoading={movementsLoading}
            movementsTotalCount={movementsTotalCount}
            movementsTotalSalesBs={movementsTotalSalesBs}
            movementsPage={movementsPage}
            movementsPageSize={movementsPageSize}
            onMovementsPageChange={setMovementsPage}
            onMovementsPageSizeChange={(n) => {
              setMovementsPage(1);
              setMovementsPageSize(n);
            }}
            inventoryItems={items}
            movementFilter={movementFilter}
            onFilterChange={(val) => {
              setMovementFilter(val);
              setMovementsPage(1);
            }}
            exportExcelLoading={exportExcelLoading}
            onExportExcel={handleExportExcel}
          />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
            {t('dashboard.emptyInventory')}
          </div>
        ) : activeTab === 'warehouse' ? (
          <InventoryListChrome
            searchValue={inventorySearch}
            onSearchChange={handleInventorySearchChange}
            page={safePage}
            pageSize={inventoryPageSize}
            totalPages={totalPages}
            totalFiltered={totalFiltered}
            onPageChange={setInventoryPage}
            onPageSizeChange={handleInventoryPageSizeChange}
          >
            {totalFiltered === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                {t('dashboard.inventoryNoMatches')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.sku')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.name')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.boxes')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.rollsPerBox')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.totalStock')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inventoryPaged.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.wholesaleQuantity}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.rollsPerBox}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                          {item.wholesaleQuantity * item.rollsPerBox}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditProductItem(item)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                              title={t('editProduct.editTooltip')}
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddStockItem(item)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                              title={t('dashboard.addStockTitle')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenBoxClick(item.id)}
                              disabled={item.wholesaleQuantity < 1 || openBoxLoading}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              {t('dashboard.openBox')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </InventoryListChrome>
        ) : (
          <InventoryListChrome
            searchValue={inventorySearch}
            onSearchChange={handleInventorySearchChange}
            page={safePage}
            pageSize={inventoryPageSize}
            totalPages={totalPages}
            totalFiltered={totalFiltered}
            onPageChange={setInventoryPage}
            onPageSizeChange={handleInventoryPageSizeChange}
          >
            {totalFiltered === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                {t('dashboard.inventoryNoMatches')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.sku')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.name')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.available')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.priceRoll')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.priceM')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inventoryPaged.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">
                          {formatRetailQuantity(
                            item,
                            t('inventory.unitMt'),
                            t('inventory.unitUnits')
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">Bs {item.pricePerRoll.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">Bs {item.pricePerMeter.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditProductItem(item)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title={t('editProduct.editTooltip')}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </InventoryListChrome>
        )}
      </main>
    </div>
  );
}
