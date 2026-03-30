import { useState } from 'react';
import { toast } from 'sonner';
import { inventoryApi } from '../api/client';
import type { InventoryItemDto } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItemDto | null;
}

export function AddStockModal({ isOpen, onClose, onSuccess, item }: AddStockModalProps) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setQuantity('1');
    setReason('');
    setError('');
    onClose();
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setError('');
    const q = Math.floor(Number(quantity));
    if (q < 1) {
      setError(t('addStock.errQty'));
      return;
    }
    setIsSubmitting(true);
    inventoryApi
      .adjustStock({
        productId: item.id,
        quantity: q,
        reason: reason.trim() || undefined,
      })
      .then(() => {
        toast.success(t('addStock.success'));
        handleClose();
        onSuccess();
      })
      .catch(() => {
        setError(t('addStock.failed'));
      })
      .finally(() => setIsSubmitting(false));
  }

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('addStock.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {item.sku} · {item.name}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {t('addStock.current', { count: item.wholesaleQuantity })}
          </p>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="add-stock-qty" className="block text-sm font-medium text-slate-700 mb-1">
              {t('addStock.qtyLabel')}
            </label>
            <input
              id="add-stock-qty"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="1"
            />
          </div>

          <div>
            <label htmlFor="add-stock-reason" className="block text-sm font-medium text-slate-700 mb-1">
              {t('addStock.reasonLabel')}
            </label>
            <input
              id="add-stock-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('addStock.reasonPlaceholder')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isSubmitting ? t('addStock.updating') : t('common.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
