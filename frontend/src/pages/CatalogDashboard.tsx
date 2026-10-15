import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Package, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { inventoryApi, productImagesApi, type CatalogCategory, type InventoryItemDto } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProductImagesModal } from '../components/ProductImagesModal';
import { Button } from '../components/ui/Button';
import { MetricStrip } from '../components/ui/Stat';

/**
 * Gestión del catálogo público: clasificación por las cuatro categorías fijas. La asignación
 * de categoría es dato de Admin, tanto individual como masiva; el resto de la vista es de
 * lectura. Las operaciones de inventario (stock, precios, estado) siguen en el inventario.
 */

type CategoryFilter = 'all' | 'none' | CatalogCategory;

const CATEGORIES: readonly CatalogCategory[] = ['Films', 'Tools', 'Accessories', 'Materials'];

const CATEGORY_LABEL_KEYS: Record<CatalogCategory, string> = {
  Films: 'productForm.categoryFilms',
  Tools: 'productForm.categoryTools',
  Accessories: 'productForm.categoryAccessories',
  Materials: 'productForm.categoryMaterials',
};

const PAGE_SIZES = [10, 25, 50] as const;

/** Etiqueta traducida; `null` = sin categoría explícita (el catálogo la infiere). */
function categoryLabel(t: (key: string) => string, category: CatalogCategory | null): string {
  return category == null ? t('erp.categoryFilterNone') : t(CATEGORY_LABEL_KEYS[category]);
}

function isMeters(item: InventoryItemDto): boolean {
  return item.unitType === 'Meters' || item.unitType === 0;
}

function CategoryBadge({ category, label }: { category: CatalogCategory | null; label: string }) {
  if (category == null) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-400">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

interface CategoryOptionLabels {
  auto: string;
  films: string;
  tools: string;
  accessories: string;
  materials: string;
}

/** Selector de categoría de un producto (Admin). Reutiliza el endpoint masivo con un solo id. */
function CategorySelect({
  value,
  disabled,
  labels,
  onChange,
}: {
  value: CatalogCategory | null;
  disabled: boolean;
  labels: CategoryOptionLabels;
  onChange: (value: CatalogCategory | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === '' ? null : (e.target.value as CatalogCategory))}
      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:cursor-wait disabled:opacity-50"
    >
      <option value="">{labels.auto}</option>
      <option value="Films">{labels.films}</option>
      <option value="Tools">{labels.tools}</option>
      <option value="Accessories">{labels.accessories}</option>
      <option value="Materials">{labels.materials}</option>
    </select>
  );
}

export function CatalogDashboard({ search }: { search: string }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes('Admin'));

  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<CatalogCategory | ''>('');
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [imagesProduct, setImagesProduct] = useState<InventoryItemDto | null>(null);

  // El catálogo público sólo expone productos activos, así que la gestión de categorías
  // trabaja sobre el mismo conjunto. El estado del fetch se resuelve en callbacks async.
  useEffect(() => {
    let cancelled = false;
    inventoryApi
      .list('active')
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.sku.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q)) {
        return false;
      }
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'none') return item.category == null;
      return item.category === categoryFilter;
    });
  }, [items, search, categoryFilter]);

  const totalFiltered = filtered.length;
  const totalPages = totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = useMemo(() => filtered.slice(start, start + pageSize), [filtered, start, pageSize]);

  const uncategorizedCount = useMemo(
    () => items.filter((item) => item.category == null).length,
    [items]
  );

  const pagedIds = useMemo(() => paged.map((item) => item.id), [paged]);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const toggleSelectPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pagedIds.length > 0 && pagedIds.every((id) => next.has(id))) {
        pagedIds.forEach((id) => next.delete(id));
      } else {
        pagedIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [pagedIds]);

  const changeCategoryFilter = useCallback((value: CategoryFilter) => {
    setCategoryFilter(value);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const categoryOptionLabels: CategoryOptionLabels = {
    auto: t('productForm.categoryAuto'),
    films: t('productForm.categoryFilms'),
    tools: t('productForm.categoryTools'),
    accessories: t('productForm.categoryAccessories'),
    materials: t('productForm.categoryMaterials'),
  };

  async function handleAssign(id: number, category: CatalogCategory | null) {
    setAssigningId(id);
    try {
      await inventoryApi.assignCategoryBulk({ productIds: [id], category });
      // Se refleja con la respuesta autoritativa en vez de recargar: un refresco completo
      // cambiaría la tabla por el esqueleto de carga por un solo cambio.
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, category } : item)));
      toast.success(t('catalog.categoryUpdated'));
    } catch {
      toast.error(t('catalog.categoryUpdateFailed'));
    } finally {
      setAssigningId(null);
    }
  }

  async function handleBulkAssignConfirm() {
    if (selectedIds.size === 0) return;
    const category = bulkCategory === '' ? null : bulkCategory;
    const ids = new Set(selectedIds);
    setBulkLoading(true);
    try {
      const res = await inventoryApi.assignCategoryBulk({ productIds: [...ids], category });
      setItems((prev) => prev.map((item) => (ids.has(item.id) ? { ...item, category } : item)));
      setBulkConfirmOpen(false);
      clearSelection();
      toast.success(t('erp.bulkAssignSuccess', { count: res.data.updatedCount }));
    } catch {
      toast.error(t('erp.bulkAssignFailed'));
    } finally {
      setBulkLoading(false);
    }
  }

  const openImages = useCallback((item: InventoryItemDto) => {
    setImagesProduct(item);
  }, []);

  /**
   * After a gallery mutation, refresh just this row's primary thumbnail instead of reloading the
   * whole table (a full reload would replace the list with the loading skeleton).
   */
  const handleImagesChanged = useCallback(async () => {
    if (!imagesProduct) return;
    try {
      const res = await productImagesApi.list(imagesProduct.id);
      const primary = res.data.find((image) => image.isPrimary) ?? res.data[0] ?? null;
      const url = primary?.url ?? null;
      setItems((prev) =>
        prev.map((row) => (row.id === imagesProduct.id ? { ...row, primaryImageUrl: url } : row))
      );
    } catch {
      // The modal already surfaced the mutation result; a stale thumbnail is not worth an error.
    }
  }, [imagesProduct]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">{t('catalog.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('catalog.subtitle')}</p>
      </div>

      <MetricStrip
        cols={3}
        metrics={[
          { label: t('catalog.metricTotal'), value: String(items.length) },
          {
            label: t('catalog.metricUncategorized'),
            value: String(uncategorizedCount),
            tone: uncategorizedCount > 0 ? 'amber' : 'default',
          },
          { label: t('catalog.metricCategorized'), value: String(items.length - uncategorizedCount) },
        ]}
      />

      {loading ? (
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded bg-slate-100" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm text-slate-500">{t('catalog.loadError')}</p>
          <Button variant="secondary" className="mt-3" onClick={refresh}>
            {t('dashboard.retry')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">{t('catalog.empty')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => changeCategoryFilter(e.target.value as CategoryFilter)}
              aria-label={t('erp.colCategory')}
              className="self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
              <option value="all">{t('erp.categoryFilterAll')}</option>
              <option value="none">{t('erp.categoryFilterNone')}</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(CATEGORY_LABEL_KEYS[category])}
                </option>
              ))}
            </select>
            <p className="max-w-3xl text-xs text-slate-500">{t('catalog.hint')}</p>
          </div>

          {isAdmin && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800">
                <Tag className="h-4 w-4" aria-hidden />
                {t('erp.bulkSelected', { count: selectedIds.size })}
              </span>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value as CatalogCategory | '')}
                aria-label={t('erp.colCategory')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="">{t('erp.categoryFilterNone')}</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(CATEGORY_LABEL_KEYS[category])}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setBulkConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                {t('erp.bulkAssignAction')}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {t('erp.bulkClearSelection')}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/[0.02]">
            {totalFiltered === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                {t('catalog.noMatches')}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {isAdmin && (
                          <th className="w-10 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={allPageSelected}
                              onChange={toggleSelectPage}
                              aria-label={t('erp.selectAllRows')}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                            />
                          </th>
                        )}
                        <th className="px-4 py-3">{t('dashboard.sku')}</th>
                        <th className="px-4 py-3">{t('dashboard.name')}</th>
                        <th className="px-4 py-3">{t('catalog.colUnit')}</th>
                        <th className="px-4 py-3">{t('erp.colCategory')}</th>
                        <th className="px-4 py-3">{t('catalog.colImages')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paged.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          {isAdmin && (
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelected(item.id)}
                                aria-label={t('erp.selectRow')}
                                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {isMeters(item) ? t('catalog.unitMeters') : t('catalog.unitUnits')}
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <CategorySelect
                                value={item.category}
                                disabled={assigningId === item.id}
                                labels={categoryOptionLabels}
                                onChange={(value) => handleAssign(item.id, value)}
                              />
                            ) : (
                              <CategoryBadge
                                category={item.category}
                                label={categoryLabel(t, item.category)}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openImages(item)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                                {item.primaryImageUrl ? (
                                  <img
                                    src={item.primaryImageUrl}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                    onError={(e) => e.currentTarget.classList.add('hidden')}
                                  />
                                ) : (
                                  <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                                )}
                              </span>
                              {isAdmin ? t('catalog.images.manage') : t('catalog.images.view')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-y divide-slate-100 md:hidden">
                  {paged.map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {isAdmin && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelected(item.id)}
                            aria-label={t('erp.selectRow')}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                          <p className="font-mono text-xs text-slate-500">{item.sku}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {isMeters(item) ? t('catalog.unitMeters') : t('catalog.unitUnits')}
                          </p>
                          <div className="mt-2">
                            {isAdmin ? (
                              <CategorySelect
                                value={item.category}
                                disabled={assigningId === item.id}
                                labels={categoryOptionLabels}
                                onChange={(value) => handleAssign(item.id, value)}
                              />
                            ) : (
                              <CategoryBadge
                                category={item.category}
                                label={categoryLabel(t, item.category)}
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openImages(item)}
                            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                              {item.primaryImageUrl ? (
                                <img
                                  src={item.primaryImageUrl}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover"
                                  onError={(e) => e.currentTarget.classList.add('hidden')}
                                />
                              ) : (
                                <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                              )}
                            </span>
                            {isAdmin ? t('catalog.images.manage') : t('catalog.images.view')}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {totalFiltered > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">{t('movements.perPage')}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    {t('movements.paginationPrev')}
                  </button>
                  <span className="min-w-[8rem] text-center text-sm tabular-nums text-slate-600">
                    {t('movements.pageOf', { current: safePage, total: totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('movements.paginationNext')}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleBulkAssignConfirm}
        title={t('erp.bulkConfirmTitle')}
        message={t('erp.bulkConfirmMessage', {
          count: selectedIds.size,
          category: categoryLabel(t, bulkCategory === '' ? null : bulkCategory),
        })}
        confirmLabel={t('erp.bulkAssignAction')}
        isLoading={bulkLoading}
      />

      {imagesProduct && (
        <ProductImagesModal
          key={imagesProduct.id}
          item={imagesProduct}
          onClose={() => setImagesProduct(null)}
          onChanged={() => void handleImagesChanged()}
        />
      )}
    </div>
  );
}
