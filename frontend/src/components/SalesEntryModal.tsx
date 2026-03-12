import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { salesApi, type SaleType } from '../api/client';
import type { InventoryItemDto } from '../api/client';

interface SalesEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: InventoryItemDto[];
}

export function SalesEntryModal({ isOpen, onClose, onSuccess, products }: SalesEntryModalProps) {
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
      setError('Select a product and enter quantity and unit price.');
      return;
    }
    const q = saleType === 'Wholesale' ? Math.floor(Number(quantity)) : Number(quantity);
    if (q <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    const price = Number(unitPrice);
    if (price < 0) {
      setError('Unit price cannot be negative.');
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
          toast.success('Sale recorded. Stock updated.');
          setProductId('');
          setQuantity('');
          setUnitPrice('');
          onSuccess();
          onClose();
        } else {
          setError(res.data.errorMessage ?? 'Failed to record sale.');
        }
      })
      .catch(() => setError('Failed to record sale.'))
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

  function handleSaleTypeChange(t: SaleType) {
    setSaleType(t);
    if (selectedProduct) {
      setUnitPrice(t === 'Wholesale' ? String(selectedProduct.pricePerRoll) : String(selectedProduct.pricePerMeter));
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">Record Sale</h2>
          <p className="text-sm text-slate-500 mt-0.5">Enter sale details and update stock</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
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
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by SKU or name..."
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
                    <li className="px-3 py-2 text-sm text-slate-500">No products match</li>
                  )}
                </ul>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sale type</label>
            <select
              value={saleType}
              onChange={(e) => handleSaleTypeChange(e.target.value as SaleType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Wholesale">Box (wholesale)</option>
              <option value="Retail">Meter / Unit (retail)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {saleType === 'Wholesale' ? 'Boxes' : 'Quantity (m or units)'}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit price</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !productId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Recording…' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
