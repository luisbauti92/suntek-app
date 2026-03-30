import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { salesApi, type SaleType } from '../api/client';
import type { InventoryItemDto } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import { roundMoney2 } from '../utils/money';

interface SalesEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: InventoryItemDto[];
}

export function SalesEntryModal({ isOpen, onClose, onSuccess, products }: SalesEntryModalProps) {
  const { t } = useLanguage();
  const [productId, setProductId] = useState<number | ''>('');
  const [saleType, setSaleType] = useState<SaleType>('Retail');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const s = search.toLowerCase();
    return products.filter(
      (p) => p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s)
    );
  }, [products, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (productId === '' || !quantity || !unitPrice) {
      setError(t('salesModal.errSelectProduct'));
      return;
    }
    const q = saleType === 'Wholesale' ? Math.floor(Number(quantity)) : Number(quantity);
    if (q <= 0) {
      setError(t('salesModal.errQtyPositive'));
      return;
    }
    const price = roundMoney2(Number(unitPrice));
    if (price < 0 || Number.isNaN(price)) {
      setError(t('salesModal.errPriceNegative'));
      return;
    }
    setIsSubmitting(true);
    salesApi
      .recordSale({
        productId: productId as number,
        quantity: q,
        saleType,
        unitPrice: price,
      })
      .then((res) => {
        if (res.data.success) {
          toast.success(t('salesModal.toastSuccess'));
          setProductId('');
          setQuantity('');
          setUnitPrice('');
          onSuccess();
          onClose();
        } else {
          setError(res.data.errorMessage ?? t('salesModal.failed'));
        }
      })
      .catch(() => setError(t('salesModal.failed')))
      .finally(() => setIsSubmitting(false));
  }

  function handleSelectProduct(id: number) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setUnitPrice(saleType === 'Wholesale' ? String(p.pricePerRoll) : String(p.pricePerMeter));
    }
    setSearch('');
  }

  function handleSaleTypeChange(typ: SaleType) {
    setSaleType(typ);
    if (selectedProduct) {
      setUnitPrice(
        typ === 'Wholesale' ? String(selectedProduct.pricePerRoll) : String(selectedProduct.pricePerMeter)
      );
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">{t('salesModal.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('salesModal.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('salesModal.product')}</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-sm font-medium text-slate-900">
                  {selectedProduct.sku} · {selectedProduct.name}
                </span>
                <button
                  type="button"
                  onClick={() => setProductId('')}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  {t('salesModal.change')}
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('salesModal.searchPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <ul className="mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {filteredProducts.slice(0, 10).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectProduct(p.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 text-slate-700"
                      >
                        {p.sku} · {p.name}
                      </button>
                    </li>
                  ))}
                  {filteredProducts.length === 0 && (
                    <li className="px-3 py-2 text-sm text-slate-500">{t('salesModal.noMatch')}</li>
                  )}
                </ul>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('salesModal.saleType')}</label>
            <select
              value={saleType}
              onChange={(e) => handleSaleTypeChange(e.target.value as SaleType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Wholesale">{t('salesModal.wholesaleOption')}</option>
              <option value="Retail">{t('salesModal.retailOption')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {saleType === 'Wholesale' ? t('salesModal.boxes') : t('salesModal.qtyRetail')}
              </label>
              <input
                type="number"
                min={saleType === 'Wholesale' ? 1 : 0.01}
                step={saleType === 'Wholesale' ? 1 : 0.01}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={saleType === 'Wholesale' ? '1' : '0'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('salesModal.unitPrice')}</label>
              <input
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(unitPrice);
                  if (!Number.isNaN(v)) setUnitPrice(String(roundMoney2(v)));
                }}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !productId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isSubmitting ? t('salesModal.recording') : t('salesModal.recordSale')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
