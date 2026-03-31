import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { inventoryApi } from '../api/client';
import type { InventoryItemDto } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import { roundMoney2 } from '../utils/money';

interface EditProductModalProps {
  item: InventoryItemDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function readApiError(err: unknown): string | null {
  if (!err || typeof err !== 'object' || !('response' in err)) return null;
  const res = (err as { response?: { data?: unknown; status?: number } }).response;
  const data = res?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    if ('message' in data && typeof (data as { message: unknown }).message === 'string') {
      return (data as { message: string }).message;
    }
    if ('errors' in data && (data as { errors: unknown }).errors) {
      const errors = (data as { errors: Record<string, string[]> }).errors;
      const flat = Object.values(errors).flat().filter(Boolean);
      if (flat.length) return flat.join(' ');
    }
  }
  return null;
}

export function EditProductModal({ item, isOpen, onClose, onSuccess }: EditProductModalProps) {
  const { t } = useLanguage();
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [rollsPerBox, setRollsPerBox] = useState('');
  const [pricePerRoll, setPricePerRoll] = useState('');
  const [pricePerMeter, setPricePerMeter] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setSku(item.sku);
    setName(item.name);
    setLength(String(roundMoney2(item.length)));
    setWidth(String(roundMoney2(item.width)));
    setRollsPerBox(String(item.rollsPerBox));
    setPricePerRoll(String(roundMoney2(item.pricePerRoll)));
    setPricePerMeter(String(roundMoney2(item.pricePerMeter)));
    setError('');
  }, [isOpen, item]);

  function handleClose() {
    setError('');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setError('');
    const len = roundMoney2(parseFloat(length));
    const wid = roundMoney2(parseFloat(width));
    const rpb = Math.floor(Number(rollsPerBox));
    const roll = roundMoney2(parseFloat(pricePerRoll));
    const meter = roundMoney2(parseFloat(pricePerMeter));
    if (!sku.trim() || !name.trim()) {
      setError(t('editProduct.validation'));
      return;
    }
    if (
      len < 0 ||
      wid < 0 ||
      rpb < 1 ||
      roll < 0 ||
      meter < 0 ||
      Number.isNaN(len) ||
      Number.isNaN(wid) ||
      Number.isNaN(rpb) ||
      Number.isNaN(roll) ||
      Number.isNaN(meter)
    ) {
      setError(t('editProduct.validation'));
      return;
    }
    setIsSubmitting(true);
    try {
      await inventoryApi.update(item.id, {
        sku: sku.trim(),
        name: name.trim(),
        length: len,
        width: wid,
        rollsPerBox: rpb,
        pricePerRoll: roll,
        pricePerMeter: meter,
      });
      toast.success(t('editProduct.success'));
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const msg = readApiError(err) ?? t('editProduct.failed');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">{t('editProduct.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('editProduct.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-sku" className="block text-sm font-medium text-slate-700 mb-1">
                {t('dashboard.sku')}
              </label>
              <input
                id="edit-sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('productForm.skuPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 mb-1">
                {t('dashboard.name')}
              </label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('productForm.namePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="edit-length" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.length')}
              </label>
              <input
                id="edit-length"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(length);
                  if (!Number.isNaN(v)) setLength(String(roundMoney2(v)));
                }}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="edit-width" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.width')}
              </label>
              <input
                id="edit-width"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(width);
                  if (!Number.isNaN(v)) setWidth(String(roundMoney2(v)));
                }}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="edit-rolls-per-box" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.rollsPerBox')}
              </label>
              <input
                id="edit-rolls-per-box"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={rollsPerBox}
                onChange={(e) => setRollsPerBox(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-price-roll" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.pricePerRoll')} (Bs)
              </label>
              <input
                id="edit-price-roll"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={pricePerRoll}
                onChange={(e) => setPricePerRoll(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(pricePerRoll);
                  if (!Number.isNaN(v)) setPricePerRoll(String(roundMoney2(v)));
                }}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="edit-price-meter" className="block text-sm font-medium text-slate-700 mb-1">
                {t('productForm.pricePerMeter')} (Bs)
              </label>
              <input
                id="edit-price-meter"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={pricePerMeter}
                onChange={(e) => setPricePerMeter(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(pricePerMeter);
                  if (!Number.isNaN(v)) setPricePerMeter(String(roundMoney2(v)));
                }}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">{t('editProduct.hint')}</p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isSubmitting ? t('editProduct.saving') : t('editProduct.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
