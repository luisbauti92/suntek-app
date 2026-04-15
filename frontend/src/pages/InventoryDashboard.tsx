import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Banknote, ChevronLeft, ChevronRight, Package, Plus, Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { inventoryApi, salesApi, usersApi, type InventoryStatusFilter } from '../api/client';
import { ProductForm } from '../components/ProductForm';
import { EditProductModal } from '../components/EditProductModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { SalesEntryModal } from '../components/SalesEntryModal';
import { AddStockModal } from '../components/AddStockModal';
import { MovementHistoryPanel } from '../components/MovementHistoryPanel';
import { AppShell } from '../components/layout/AppShell';
import type { ErpNavId } from '../components/layout/erpNav';
import { KpiStrip } from '../components/dashboard/KpiStrip';
import { UsersPanel } from '../components/users/UsersPanel';
import { StockBadge } from '../components/StockBadge';
import {
  StorefrontRowActionsDropdown,
  WarehouseRowActionsDropdown,
} from '../components/RowActionsDropdown';
import type { MovementFilterValue } from '../components/MovementFilterBar';
import type { InventoryItemDto, MovementDto, UserListItemDto } from '../api/client';
import {
  estimateInventoryValueBs,
  lowStockAlertCount,
  stockHealthPercent,
  storefrontStockLevel,
  warehouseStockLevel,
} from '../utils/inventoryMetrics';
import { formatBs } from '../utils/formatBs';

const SIDEBAR_KEY = 'suntek_erp_sidebar_collapsed';

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

function useClientInventoryPaging(
  items: InventoryItemDto[],
  searchRaw: string,
  page: number,
  pageSize: number
) {
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

function countRecentLogins(users: UserListItemDto[], hours = 24): number {
  const ms = hours * 60 * 60 * 1000;
  const t0 = Date.now() - ms;
  return users.filter((u) => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= t0).length;
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
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/[0.02]">
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
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = Boolean(user?.roles?.includes('Admin'));

  const [activeNav, setActiveNav] = useState<ErpNavId>('dashboard');
  const [warehouseView, setWarehouseView] = useState<'warehouse' | 'storefront'>('warehouse');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(SIDEBAR_KEY) === '1'
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
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
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<InventoryStatusFilter>('active');
  const [userSearch, setUserSearch] = useState('');
  const [directoryUsers, setDirectoryUsers] = useState<UserListItemDto[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(() =>
    Boolean(user?.roles?.includes('Admin'))
  );
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [discontinueItemId, setDiscontinueItemId] = useState<number | null>(null);
  const [discontinueLoading, setDiscontinueLoading] = useState(false);
  const [archiveItemId, setArchiveItemId] = useState<number | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const { paged: inventoryPaged, totalFiltered, totalPages, safePage } =
    useClientInventoryPaging(items, inventorySearch, inventoryPage, inventoryPageSize);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

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
      .list(inventoryStatusFilter)
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [inventoryStatusFilter]);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  useEffect(() => {
    if (!isAdmin) {
      setDirectoryUsers([]);
      setDirectoryLoading(false);
      return;
    }
    let cancelled = false;
    setDirectoryLoading(true);
    usersApi
      .list()
      .then((r) => {
        if (!cancelled) setDirectoryUsers(r.data);
      })
      .catch(() => {
        if (!cancelled) setDirectoryUsers([]);
      })
      .finally(() => {
        if (!cancelled) setDirectoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

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
    if (activeNav === 'sales') refreshMovements();
  }, [activeNav, movementFilter, movementsPage, movementsPageSize, refreshMovements]);

  useEffect(() => {
    setOpenMenuKey(null);
  }, [activeNav, warehouseView]);

  function handleOpenBoxClick(productId: number) {
    setOpenBoxProductId(productId);
  }

  function handleArchiveClick(productId: number) {
    setArchiveItemId(productId);
  }

  function handleDiscontinueClick(productId: number) {
    setDiscontinueItemId(productId);
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
      /* keep modal */
    } finally {
      setOpenBoxLoading(false);
    }
  }

  async function handleArchiveConfirm() {
    if (archiveItemId == null) return;
    setArchiveLoading(true);
    try
    {
      await inventoryApi.updateStatus(archiveItemId, 'Archived');
      setArchiveItemId(null);
      refreshItems();
      toast.success(t('erp.archiveSuccess'));
    } catch {
      toast.error(t('erp.archiveFailed'));
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleDiscontinueConfirm() {
    if (discontinueItemId == null) return;
    setDiscontinueLoading(true);
    try {
      await inventoryApi.updateStatus(discontinueItemId, 'Discontinued');
      setDiscontinueItemId(null);
      refreshItems();
      toast.success(t('erp.discontinueSuccess'));
    } catch {
      toast.error(t('erp.discontinueFailed'));
    } finally {
      setDiscontinueLoading(false);
    }
  }

  const kpiLoading = loading || (isAdmin && directoryLoading);

  const kpiProps = useMemo(() => {
    const valueBs = estimateInventoryValueBs(items);
    const health = stockHealthPercent(items);
    const low = lowStockAlertCount(items);
    const fourthTitle = isAdmin ? t('erp.kpiActiveStaff') : t('erp.kpiSkusTitle');
    const recent = countRecentLogins(directoryUsers, 24);
    const fourthValue = isAdmin ? String(recent) : String(items.length);
    const fourthHint = isAdmin ? t('erp.kpiActiveStaffHint') : t('erp.kpiSkusHint');
    return {
      inventoryValueLabel: formatBs(valueBs),
      stockHealthLabel: `${health}%`,
      lowStockCount: String(low),
      fourthTitle,
      fourthValue,
      fourthHint,
      lowStockStress: low > 0,
    };
  }, [items, directoryUsers, isAdmin, t]);

  const headerSearchValue = activeNav === 'users' ? userSearch : inventorySearch;
  const onHeaderSearchChange = activeNav === 'users' ? setUserSearch : handleInventorySearchChange;
  const headerSearchEnabled =
    activeNav === 'dashboard' || activeNav === 'warehouse' || activeNav === 'users';
  const headerSearchPlaceholder =
    activeNav === 'users' ? t('erp.usersSearchPlaceholder') : t('dashboard.inventorySearchPlaceholder');

  function navigateNav(id: ErpNavId) {
    setActiveNav(id);
    if (id === 'warehouse') setWarehouseView('warehouse');
  }

  const badgeLabels = {
    full: t('erp.badgeFull'),
    low: t('erp.badgeLow'),
    out: t('erp.badgeOut'),
  };

  const rowActionLabels = {
    more: t('erp.actionsMore'),
    edit: t('editProduct.editTooltip'),
    addStock: t('dashboard.addStockTitle'),
    openBox: t('dashboard.openBox'),
    discontinue: t('erp.discontinueAction'),
    archive: t('erp.archiveAction'),
  };

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={navigateNav}
      isAdmin={isAdmin}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebarCollapsed={() => setSidebarCollapsed((c) => !c)}
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
      headerSearchValue={headerSearchValue}
      onHeaderSearchChange={onHeaderSearchChange}
      headerSearchPlaceholder={headerSearchPlaceholder}
      headerSearchEnabled={headerSearchEnabled}
    >
      <ProductForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refreshItems}
      />

      <SalesEntryModal
        isOpen={salesModalOpen}
        onClose={() => setSalesModalOpen(false)}
        onSuccess={() => {
          refreshItems();
          if (activeNav === 'sales') refreshMovements();
        }}
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
      <ConfirmModal
        isOpen={discontinueItemId != null}
        onClose={() => setDiscontinueItemId(null)}
        onConfirm={handleDiscontinueConfirm}
        title={t('erp.discontinueTitle')}
        message={t('erp.discontinueMessage')}
        confirmLabel={t('erp.discontinueAction')}
        isLoading={discontinueLoading}
      />
      <ConfirmModal
        isOpen={archiveItemId != null}
        onClose={() => setArchiveItemId(null)}
        onConfirm={handleArchiveConfirm}
        title={t('erp.archiveTitle')}
        message={t('erp.archiveMessage')}
        confirmLabel={t('erp.archiveAction')}
        isLoading={archiveLoading}
      />

      <AddStockModal
        isOpen={addStockItem != null}
        onClose={() => setAddStockItem(null)}
        onSuccess={() => {
          refreshItems();
          if (activeNav === 'sales') refreshMovements();
        }}
        item={addStockItem}
      />

      <EditProductModal
        item={editProductItem}
        isOpen={editProductItem != null}
        onClose={() => setEditProductItem(null)}
        onSuccess={() => {
          refreshItems();
          if (activeNav === 'sales') refreshMovements();
        }}
      />

      {activeNav === 'dashboard' && (
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {t('erp.dashboardWelcomeTitle')}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{t('erp.dashboardWelcomeBody')}</p>
          </div>
          <KpiStrip
            loading={kpiLoading}
            inventoryValueLabel={kpiProps.inventoryValueLabel}
            inventoryValueHint={t('erp.kpiInventoryValueHint')}
            stockHealthLabel={kpiProps.stockHealthLabel}
            stockHealthHint={t('erp.kpiStockHealthHint')}
            lowStockCount={kpiProps.lowStockCount}
            lowStockHint={t('erp.kpiLowStockHint')}
            lowStockStress={kpiProps.lowStockStress}
            fourthTitle={kpiProps.fourthTitle}
            fourthValue={kpiProps.fourthValue}
            fourthHint={kpiProps.fourthHint}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => navigateNav('warehouse')}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm ring-1 ring-slate-950/[0.02] transition hover:border-violet-200 hover:shadow-md"
            >
              <Package className="h-8 w-8 text-violet-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">{t('dashboard.tabWarehouse')}</h3>
              <p className="mt-1 text-sm text-slate-500">{t('erp.warehouseToolbarHint')}</p>
            </button>
            <button
              type="button"
              onClick={() => navigateNav('sales')}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm ring-1 ring-slate-950/[0.02] transition hover:border-violet-200 hover:shadow-md"
            >
              <ShoppingCart className="h-8 w-8 text-violet-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">{t('dashboard.tabMovements')}</h3>
              <p className="mt-1 text-sm text-slate-500">{t('movements.kpiSalesHint')}</p>
            </button>
          </div>
        </div>
      )}

      {activeNav === 'warehouse' && (
        <div className="mx-auto max-w-7xl space-y-6">
          <KpiStrip
            loading={kpiLoading}
            inventoryValueLabel={kpiProps.inventoryValueLabel}
            inventoryValueHint={t('erp.kpiInventoryValueHint')}
            stockHealthLabel={kpiProps.stockHealthLabel}
            stockHealthHint={t('erp.kpiStockHealthHint')}
            lowStockCount={kpiProps.lowStockCount}
            lowStockHint={t('erp.kpiLowStockHint')}
            lowStockStress={kpiProps.lowStockStress}
            fourthTitle={kpiProps.fourthTitle}
            fourthValue={kpiProps.fourthValue}
            fourthHint={kpiProps.fourthHint}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setWarehouseView('warehouse')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  warehouseView === 'warehouse'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('dashboard.tabWarehouse')}
              </button>
              <button
                type="button"
                onClick={() => setWarehouseView('storefront')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  warehouseView === 'storefront'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('dashboard.tabStorefront')}
              </button>
              <div className="ml-2 h-6 w-px bg-slate-200" />
              <button
                type="button"
                onClick={() => setInventoryStatusFilter('active')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  inventoryStatusFilter === 'active'
                    ? 'bg-violet-100 text-violet-800 ring-1 ring-violet-200'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('erp.filterActive')}
              </button>
              <button
                type="button"
                onClick={() => setInventoryStatusFilter('discontinued')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  inventoryStatusFilter === 'discontinued'
                    ? 'bg-orange-100 text-orange-900 ring-1 ring-orange-200'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('erp.filterDiscontinued')}
              </button>
              <button
                type="button"
                onClick={() => setInventoryStatusFilter('archived')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  inventoryStatusFilter === 'archived'
                    ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('erp.filterArchived')}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSalesModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Banknote className="h-4 w-4" />
                {t('dashboard.recordSale')}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                {t('dashboard.addProduct')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 rounded bg-slate-100" />
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <Package className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                {inventoryStatusFilter === 'archived'
                  ? t('erp.filterArchived')
                  : inventoryStatusFilter === 'discontinued'
                    ? t('erp.filterDiscontinued')
                  : t('dashboard.emptyInventory')}
              </p>
            </div>
          ) : warehouseView === 'warehouse' ? (
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
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">{t('dashboard.sku')}</th>
                        <th className="px-4 py-3">{t('dashboard.name')}</th>
                        <th className="px-4 py-3">{t('dashboard.boxes')}</th>
                        <th className="px-4 py-3">{t('dashboard.rollsPerBox')}</th>
                        <th className="px-4 py-3">{t('dashboard.totalStock')}</th>
                        <th className="px-4 py-3">{t('erp.colStock')}</th>
                        <th className="px-4 py-3 text-right">{t('dashboard.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryPaged.map((item) => {
                        const total = item.wholesaleQuantity * item.rollsPerBox;
                        const wLevel = warehouseStockLevel(item);
                        const key = `w-${item.id}`;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium tabular-nums text-slate-900">{item.sku}</td>
                            <td className="px-4 py-3 text-slate-700">{item.name}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-600">{item.wholesaleQuantity}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-600">{item.rollsPerBox}</td>
                            <td className="px-4 py-3 font-medium tabular-nums text-slate-800">{total}</td>
                            <td className="px-4 py-3">
                              <StockBadge level={wLevel} labels={badgeLabels} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <WarehouseRowActionsDropdown
                                open={openMenuKey === key}
                                onOpenChange={(open) => setOpenMenuKey(open ? key : null)}
                                onEdit={() => setEditProductItem(item)}
                                onAddStock={() => setAddStockItem(item)}
                                onOpenBox={() => handleOpenBoxClick(item.id)}
                                onDiscontinue={() => handleDiscontinueClick(item.id)}
                                discontinueDisabled={inventoryStatusFilter !== 'active' || !isAdmin}
                                onArchive={() => handleArchiveClick(item.id)}
                                archiveDisabled={inventoryStatusFilter === 'archived' || !isAdmin}
                                openBoxDisabled={item.wholesaleQuantity < 1 || openBoxLoading}
                                labels={rowActionLabels}
                              />
                            </td>
                          </tr>
                        );
                      })}
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
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">{t('dashboard.sku')}</th>
                        <th className="px-4 py-3">{t('dashboard.name')}</th>
                        <th className="px-4 py-3">{t('dashboard.available')}</th>
                        <th className="px-4 py-3">{t('erp.colStock')}</th>
                        <th className="px-4 py-3">{t('dashboard.priceRoll')}</th>
                        <th className="px-4 py-3">{t('dashboard.priceM')}</th>
                        <th className="px-4 py-3 text-right">{t('dashboard.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryPaged.map((item) => {
                        const sLevel = storefrontStockLevel(item);
                        const key = `s-${item.id}`;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium tabular-nums text-slate-900">{item.sku}</td>
                            <td className="px-4 py-3 text-slate-700">{item.name}</td>
                            <td className="px-4 py-3 font-medium tabular-nums text-slate-800">
                              {formatRetailQuantity(
                                item,
                                t('inventory.unitMt'),
                                t('inventory.unitUnits')
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StockBadge level={sLevel} labels={badgeLabels} />
                            </td>
                            <td className="px-4 py-3 tabular-nums text-slate-600">
                              Bs {item.pricePerRoll.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-slate-600">
                              Bs {item.pricePerMeter.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <StorefrontRowActionsDropdown
                                open={openMenuKey === key}
                                onOpenChange={(open) => setOpenMenuKey(open ? key : null)}
                                onEdit={() => setEditProductItem(item)}
                                onDiscontinue={() => handleDiscontinueClick(item.id)}
                                discontinueDisabled={inventoryStatusFilter !== 'active' || !isAdmin}
                                onArchive={() => handleArchiveClick(item.id)}
                                archiveDisabled={inventoryStatusFilter === 'archived' || !isAdmin}
                                labels={{
                                  more: rowActionLabels.more,
                                  edit: rowActionLabels.edit,
                                  discontinue: rowActionLabels.discontinue,
                                  archive: rowActionLabels.archive,
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </InventoryListChrome>
          )}
        </div>
      )}

      {activeNav === 'sales' && (
        <div className="mx-auto max-w-7xl space-y-6">
          <KpiStrip
            loading={kpiLoading}
            inventoryValueLabel={kpiProps.inventoryValueLabel}
            inventoryValueHint={t('erp.kpiInventoryValueHint')}
            stockHealthLabel={kpiProps.stockHealthLabel}
            stockHealthHint={t('erp.kpiStockHealthHint')}
            lowStockCount={kpiProps.lowStockCount}
            lowStockHint={t('erp.kpiLowStockHint')}
            lowStockStress={kpiProps.lowStockStress}
            fourthTitle={kpiProps.fourthTitle}
            fourthValue={kpiProps.fourthValue}
            fourthHint={kpiProps.fourthHint}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSalesModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Banknote className="h-4 w-4" />
              {t('dashboard.recordSale')}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/[0.02]">
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
          </div>
        </div>
      )}

      {activeNav === 'users' && isAdmin && (
        <div className="mx-auto max-w-7xl">
          <UsersPanel search={userSearch} />
        </div>
      )}

      {activeNav === 'users' && !isAdmin && (
        <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-600">{t('erp.usersAdminOnly')}</p>
        </div>
      )}

      {activeNav === 'settings' && (
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-10 shadow-sm ring-1 ring-slate-950/[0.02]">
          <h2 className="text-lg font-semibold text-slate-900">{t('erp.settingsTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('erp.settingsComingSoon')}</p>
        </div>
      )}
    </AppShell>
  );
}
